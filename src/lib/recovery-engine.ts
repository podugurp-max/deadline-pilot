export type Energy = "low" | "medium" | "high";
export type Difficulty = "easy" | "medium" | "hard";
export type Feasibility = "manageable" | "tight" | "overloaded" | "provisional";

export interface StudentContext {
  currentDate: string;
  hoursToday: number;
  hoursTomorrow: number;
  energy: Energy;
  stress: Energy;
  fixedCommitments: string;
}

export interface Assignment {
  id: string;
  name: string;
  course: string;
  dueAt: string; // ISO datetime, may be empty
  hoursRemaining: number;
  weight: number; // 0-100 importance/grade weight
  progress: number; // 0-100
  difficulty: Difficulty;
  notes: string;
}

export interface IncompleteAssignment {
  id: string;
  displayName: string;
  reasons: string[];
}

export interface RankedAssignment extends Assignment {
  score: number;
  hoursUntilDue: number | null;
  dueLabel: string;
  rationale: string;
  isIncomplete: boolean;
  incompleteReasons: string[];
}

export interface RecoveryPlanStep {
  assignmentId: string;
  assignmentName: string;
  block: "today" | "tomorrow" | "after" | "triage-defer" | "triage-partial";
  hoursAllocated: number;
  note: string;
}

export interface RecoveryPlan {
  summary: string;
  feasibility: Feasibility;
  rawRequiredHours: number;
  adjustedRequiredHours: number;
  availableHours: number;
  workloadRatio: number; // adjusted / available
  ranking: RankedAssignment[];
  plan: RecoveryPlanStep[];
  firstNextAction: string;
  risks: string[];
  missingInfo: string[];
  incompleteAssignments: IncompleteAssignment[];
  reviewerCheck: string;
  reviewerApproved: boolean;
  trace: AgentTrace[];
}

export interface AgentTrace {
  agent:
    | "Task Parser Agent"
    | "Priority Agent"
    | "Feasibility Agent"
    | "Schedule Builder Agent"
    | "Risk Agent"
    | "Reviewer Agent";
  output: string;
  details?: string[];
}

const diffWeight: Record<Difficulty, number> = { easy: 1, medium: 1.25, hard: 1.6 };

function hoursBetween(fromIso: string, toIso: string) {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (!isFinite(a) || !isFinite(b)) return null;
  return (b - a) / (1000 * 60 * 60);
}

const PLACEHOLDER_RE = /^\s*(idk|tbd|todo|n\/a|na|\?+|none|test|placeholder|untitled)\s*$/i;
const isPlaceholder = (s: string) => !!s && PLACEHOLDER_RE.test(s);

function describeIncomplete(a: Assignment): string[] {
  const reasons: string[] = [];
  if (!a.name.trim()) reasons.push("missing assignment name");
  else if (isPlaceholder(a.name)) reasons.push(`placeholder name "${a.name.trim()}"`);
  if (!a.dueAt) reasons.push("missing due date");
  else if (isNaN(new Date(a.dueAt).getTime())) reasons.push("invalid due date");
  if (a.hoursRemaining === null || a.hoursRemaining === undefined || isNaN(a.hoursRemaining as number))
    reasons.push("missing hours estimate");
  else if (a.hoursRemaining <= 0 && a.progress < 100)
    reasons.push("0 hours remaining but task is not 100% complete — effort estimate likely missing");
  return reasons;
}

export function runRecovery(
  ctx: StudentContext,
  assignments: Assignment[],
): RecoveryPlan {
  const trace: AgentTrace[] = [];
  const missingInfo: string[] = [];
  const incompleteAssignments: IncompleteAssignment[] = [];

  // ---------- Task Parser ----------
  // Keep any row with at least one usable signal so we don't silently drop things.
  const considered = assignments.filter(
    (a) => a.name.trim() !== "" || a.course.trim() !== "" || a.dueAt !== "" || a.hoursRemaining > 0,
  );

  const usable: Assignment[] = [];
  considered.forEach((a) => {
    const reasons = describeIncomplete(a);
    const displayName = a.name.trim() || a.course.trim() || "Unnamed assignment";
    if (reasons.length > 0) {
      incompleteAssignments.push({ id: a.id, displayName, reasons });
      reasons.forEach((r) => missingInfo.push(`${displayName}: ${r}`));
    }
    // A task is usable for scheduling only if it has a parseable due date and >0 hours.
    const hasUsableHours = a.hoursRemaining > 0;
    const hasUsableDate = !!a.dueAt && !isNaN(new Date(a.dueAt).getTime());
    if (hasUsableHours && hasUsableDate && a.name.trim() !== "" && !isPlaceholder(a.name)) {
      usable.push(a);
    }
  });

  trace.push({
    agent: "Task Parser Agent",
    output: `Parsed ${usable.length} usable assignment${usable.length === 1 ? "" : "s"} and flagged ${incompleteAssignments.length} incomplete assignment${incompleteAssignments.length === 1 ? "" : "s"}.`,
    details: [
      ...usable.map(
        (a) =>
          `usable: ${a.name} (${a.course || "—"}) — ${a.hoursRemaining}h left, ${a.progress}% done, due ${a.dueAt}`,
      ),
      ...incompleteAssignments.map((i) => `incomplete: ${i.displayName} — ${i.reasons.join("; ")}`),
    ],
  });

  // ---------- Priority Agent ----------
  const now = ctx.currentDate || new Date().toISOString();
  const allForRanking = [...usable, ...incompleteAssignments.map((i) => assignments.find((a) => a.id === i.id)!).filter(Boolean)];
  // Deduplicate while preserving order
  const seenIds = new Set<string>();
  const rankInput = allForRanking.filter((a) => {
    if (seenIds.has(a.id)) return false;
    seenIds.add(a.id);
    return true;
  });

  const ranked: RankedAssignment[] = rankInput
    .map((a) => {
      const incompleteReasons = describeIncomplete(a);
      const isIncomplete = incompleteReasons.length > 0;
      const hUntilDue = a.dueAt ? hoursBetween(now, a.dueAt) : null;

      let dueLabel: string;
      if (hUntilDue === null) dueLabel = "Due date missing";
      else if (hUntilDue < 0) dueLabel = `Overdue by ${Math.abs(hUntilDue).toFixed(1)}h`;
      else dueLabel = `Due in ${hUntilDue.toFixed(1)}h`;

      // Score: incomplete tasks get a low score so they don't dominate
      let score = 0;
      let rationale = "";
      if (hUntilDue === null || a.hoursRemaining <= 0) {
        score = -1;
        rationale = `${dueLabel} · weight ${a.weight}% · ${a.progress}% done · ${a.difficulty} — needs clarification before it can be ranked`;
      } else {
        const urgency = 1 / Math.max(hUntilDue, 1);
        const remainingRatio = 1 - a.progress / 100;
        score =
          urgency * 60 +
          (a.weight / 100) * 25 +
          remainingRatio * 10 +
          (diffWeight[a.difficulty] - 1) * 5;
        rationale = `${dueLabel} · weight ${a.weight}% · ${a.progress}% done · ${a.difficulty}`;
      }

      return {
        ...a,
        score,
        hoursUntilDue: hUntilDue,
        dueLabel,
        rationale,
        isIncomplete,
        incompleteReasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Explain weight tradeoffs in priority rationale
  for (let i = 0; i < ranked.length - 1; i++) {
    const cur = ranked[i];
    const next = ranked[i + 1];
    if (
      cur.hoursUntilDue !== null &&
      next.hoursUntilDue !== null &&
      cur.hoursUntilDue > next.hoursUntilDue + 1 &&
      cur.weight >= next.weight * 1.5
    ) {
      cur.rationale += ` — ranked above "${next.name}" (due sooner) because grade weight is ${cur.weight}% vs ${next.weight}%`;
    }
  }

  trace.push({
    agent: "Priority Agent",
    output: `Ranked ${ranked.length} task${ranked.length === 1 ? "" : "s"} by urgency, weight, progress, and difficulty. Incomplete tasks sorted last pending clarification.`,
    details: ranked.map(
      (r, i) =>
        `${i + 1}. ${r.name || "(unnamed)"}${r.isIncomplete ? " [needs clarification]" : ""} — ${r.rationale}`,
    ),
  });

  // ---------- Feasibility Agent ----------
  const rawRequiredHours = usable.reduce((sum, a) => sum + a.hoursRemaining, 0);
  const adjustedRequiredHours = usable.reduce(
    (sum, a) => sum + a.hoursRemaining * diffWeight[a.difficulty],
    0,
  );
  const availableHours = (ctx.hoursToday || 0) + (ctx.hoursTomorrow || 0);
  const ratio = availableHours > 0 ? adjustedRequiredHours / availableHours : Infinity;

  let feasibility: Feasibility;
  const hasProvisionalConcerns = incompleteAssignments.length > 0;
  if (usable.length === 0 && hasProvisionalConcerns) {
    feasibility = "provisional";
  } else if (ratio > 1.15) {
    feasibility = "overloaded";
  } else if (ratio >= 0.86) {
    feasibility = "tight";
  } else if (hasProvisionalConcerns) {
    // Don't confidently say "manageable" when key info is missing
    feasibility = "provisional";
  } else {
    feasibility = "manageable";
  }

  trace.push({
    agent: "Feasibility Agent",
    output: `Raw ${rawRequiredHours.toFixed(1)}h · difficulty-adjusted ${adjustedRequiredHours.toFixed(1)}h vs available ${availableHours.toFixed(1)}h → ratio ${isFinite(ratio) ? ratio.toFixed(2) : "∞"} → ${feasibility}.`,
    details: [
      "Difficulty multipliers (for feasibility & risk only): easy×1.0, medium×1.25, hard×1.6.",
      "Schedule blocks use raw hours remaining, not adjusted hours.",
      "Thresholds: ≤0.85 manageable · 0.86–1.15 tight · ≥1.16 overloaded. Provisional overrides when key info is missing.",
    ],
  });

  // ---------- Schedule Builder ----------
  // Allocate using RAW hours remaining (not adjusted), per requirement #2.
  const plan: RecoveryPlanStep[] = [];
  let todayLeft = ctx.hoursToday || 0;
  let tomorrowLeft = ctx.hoursTomorrow || 0;
  const schedulable = ranked.filter((r) => !r.isIncomplete && r.hoursRemaining > 0);

  for (const task of schedulable) {
    const needed = task.hoursRemaining; // raw
    if (feasibility === "overloaded" && needed > todayLeft + tomorrowLeft) {
      const give = Math.min(needed, todayLeft + tomorrowLeft);
      if (give <= 0) {
        plan.push({
          assignmentId: task.id,
          assignmentName: task.name,
          block: "triage-defer",
          hoursAllocated: 0,
          note: "Triage: defer or request extension — cannot fit before deadline.",
        });
        continue;
      }
      const fromToday = Math.min(todayLeft, give);
      todayLeft -= fromToday;
      const fromTomorrow = Math.min(tomorrowLeft, give - fromToday);
      tomorrowLeft -= fromTomorrow;
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "triage-partial",
        hoursAllocated: fromToday + fromTomorrow,
        note: `Triage partial: aim for highest-impact ${(fromToday + fromTomorrow).toFixed(1)}h of work, not full completion.`,
      });
      continue;
    }

    let remaining = needed;
    const fromToday = Math.min(todayLeft, remaining);
    if (fromToday > 0) {
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "today",
        hoursAllocated: fromToday,
        note: `Work ${fromToday.toFixed(1)}h today (of ${task.hoursRemaining}h remaining).`,
      });
      todayLeft -= fromToday;
      remaining -= fromToday;
    }
    if (remaining > 0) {
      const fromTomorrow = Math.min(tomorrowLeft, remaining);
      if (fromTomorrow > 0) {
        plan.push({
          assignmentId: task.id,
          assignmentName: task.name,
          block: "tomorrow",
          hoursAllocated: fromTomorrow,
          note: `Continue ${fromTomorrow.toFixed(1)}h tomorrow.`,
        });
        tomorrowLeft -= fromTomorrow;
        remaining -= fromTomorrow;
      }
    }
    if (remaining > 0.05) {
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "after",
        hoursAllocated: remaining,
        note: `${remaining.toFixed(1)}h still need a slot beyond today/tomorrow.`,
      });
    }
  }

  trace.push({
    agent: "Schedule Builder Agent",
    output:
      feasibility === "overloaded"
        ? "Built a triage plan — not all work will be completed. Allocations use raw hours remaining."
        : "Allocated work across today and tomorrow by priority using raw hours remaining.",
    details: plan.map(
      (p) => `${p.assignmentName} → ${p.block} (${p.hoursAllocated.toFixed(1)}h)`,
    ),
  });

  // ---------- Risk Agent ----------
  const risks: string[] = [];
  if (feasibility === "overloaded")
    risks.push("Workload exceeds available time — completing everything is not realistic.");
  if (feasibility === "provisional")
    risks.push("Plan is provisional: key information is missing. Confirm before committing to this schedule.");
  if (ctx.energy === "low" && adjustedRequiredHours > 4)
    risks.push("Low energy with >4h of work — productivity per hour will drop; build in breaks.");
  if (ctx.stress === "high")
    risks.push("High stress reported — risk of avoidance/procrastination spiral.");
  ranked.forEach((r) => {
    if (r.hoursRemaining <= 0 && r.progress < 100 && (r.difficulty === "medium" || r.difficulty === "hard"))
      risks.push(
        `${r.name || "(unnamed task)"} has 0 hours remaining but only ${r.progress}% progress on a ${r.difficulty} task — effort estimate is almost certainly missing.`,
      );
    if (r.hoursUntilDue !== null && r.hoursUntilDue < 12 && r.progress < 50)
      risks.push(
        `${r.name} is due in <12h and only ${r.progress}% done — high risk of missing deadline.`,
      );
    if (r.difficulty === "hard" && r.hoursUntilDue !== null && r.hoursUntilDue < 24 && r.progress < 30)
      risks.push(`${r.name} is hard, <24h out, low progress — consider asking for help now.`);
  });
  trace.push({
    agent: "Risk Agent",
    output: `${risks.length} risk${risks.length === 1 ? "" : "s"} identified.`,
    details: risks,
  });

  // ---------- First next action ----------
  const topRanked = ranked[0];
  let firstNextAction: string;
  if (!topRanked) {
    firstNextAction = "Add at least one assignment to get a recommendation.";
  } else if (topRanked.isIncomplete) {
    firstNextAction = `Clarify the missing deadline and realistic effort estimate for "${topRanked.name || topRanked.course || "this task"}" before relying on this plan.`;
  } else {
    const firstSchedulable = schedulable[0];
    if (firstSchedulable) {
      firstNextAction = `Start ${firstSchedulable.name} (${firstSchedulable.course || "—"}) right now for a focused ${Math.min(
        90,
        Math.max(25, Math.round(firstSchedulable.hoursRemaining * 30)),
      )}-minute block — it has the highest urgency × impact score.`;
    } else {
      firstNextAction = `Clarify missing information before starting work — no task has enough data to schedule safely.`;
    }
  }

  // ---------- Summary ----------
  const statusLabel =
    feasibility === "provisional" ? "NEEDS CLARIFICATION" : feasibility.toUpperCase();
  const summary =
    rankInput.length === 0
      ? "No assignments entered yet."
      : `${usable.length} schedulable · ${incompleteAssignments.length} needs clarification · raw ${rawRequiredHours.toFixed(1)}h, adjusted ${adjustedRequiredHours.toFixed(1)}h vs ${availableHours.toFixed(1)}h available. Status: ${statusLabel}.`;

  // ---------- Reviewer Agent (deterministic) ----------
  const reviewerIssues: string[] = [];
  if (feasibility === "overloaded" && !plan.some((p) => p.block.startsWith("triage")))
    reviewerIssues.push("Overloaded status without triage steps — plan is unrealistic.");
  if (incompleteAssignments.length > 0)
    reviewerIssues.push(`${incompleteAssignments.length} assignment(s) need clarification before this plan is reliable.`);
  if (rankInput.length > 0 && availableHours === 0)
    reviewerIssues.push("Zero available hours entered — cannot schedule anything.");
  const reviewerApproved = reviewerIssues.length === 0;
  const reviewerCheck = reviewerApproved
    ? "APPROVED — plan is internally consistent. Feasibility matches schedule; risks acknowledged."
    : `NEEDS REVISION — ${reviewerIssues.join(" ")}`;
  trace.push({
    agent: "Reviewer Agent",
    output: reviewerCheck,
    details: reviewerIssues,
  });

  return {
    summary,
    feasibility,
    rawRequiredHours,
    adjustedRequiredHours,
    availableHours,
    workloadRatio: ratio,
    ranking: ranked,
    plan,
    firstNextAction,
    risks,
    missingInfo,
    incompleteAssignments,
    reviewerCheck,
    reviewerApproved,
    trace,
  };
}
