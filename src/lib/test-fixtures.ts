import type { Assignment, StudentContext } from "./recovery-engine";

const isoIn = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  // datetime-local format YYYY-MM-DDTHH:mm
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export interface TestFixture {
  label: string;
  description: string;
  context: StudentContext;
  assignments: Assignment[];
}

export const normalWorkloadTest: TestFixture = {
  label: "Normal Workload",
  description: "Comfortable schedule — the plan should come back manageable and approved.",
  context: {
    currentDate: today(),
    hoursToday: 4,
    hoursTomorrow: 5,
    energy: "high",
    stress: "low",
    fixedCommitments: "Class 10–12, gym 6–7pm",
  },
  assignments: [
    {
      id: crypto.randomUUID(),
      name: "Reading response — Chapter 4",
      course: "PHIL 110",
      dueAt: isoIn(30),
      hoursRemaining: 1.5,
      weight: 5,
      progress: 20,
      difficulty: "easy",
      notes: "Just need to finish reading and write 300 words.",
    },
    {
      id: crypto.randomUUID(),
      name: "Problem set 3",
      course: "MATH 220",
      dueAt: isoIn(46),
      hoursRemaining: 2,
      weight: 10,
      progress: 40,
      difficulty: "medium",
      notes: "Stuck on problem 5.",
    },
    {
      id: crypto.randomUUID(),
      name: "Lab write-up",
      course: "BIO 130",
      dueAt: isoIn(54),
      hoursRemaining: 2,
      weight: 8,
      progress: 60,
      difficulty: "medium",
      notes: "",
    },
  ],
};

export const messyInputTest: TestFixture = {
  label: "Messy Input",
  description:
    "Incomplete and inconsistent fields — reviewer should flag missing information.",
  context: {
    currentDate: today(),
    hoursToday: 2,
    hoursTomorrow: 3,
    energy: "low",
    stress: "high",
    fixedCommitments: "idk maybe work?",
  },
  assignments: [
    {
      id: crypto.randomUUID(),
      name: "Essay thing",
      course: "",
      dueAt: "", // missing
      hoursRemaining: 0, // missing estimate
      weight: 25,
      progress: 0,
      difficulty: "hard",
      notes: "Professor said it's due 'soon'.",
    },
    {
      id: crypto.randomUUID(),
      name: "Group project slides",
      course: "BUS 250",
      dueAt: isoIn(20),
      hoursRemaining: 3,
      weight: 15,
      progress: 10,
      difficulty: "medium",
      notes: "Two teammates haven't responded.",
    },
    {
      id: crypto.randomUUID(),
      name: "",
      course: "CHEM 101",
      dueAt: isoIn(8),
      hoursRemaining: 1,
      weight: 5,
      progress: 0,
      difficulty: "easy",
      notes: "Forgot the assignment name.",
    },
  ],
};

export const overloadFailureTest: TestFixture = {
  label: "Overload Failure",
  description:
    "Required hours far exceed available hours — the agent must refuse false reassurance and triage.",
  context: {
    currentDate: today(),
    hoursToday: 2,
    hoursTomorrow: 3,
    energy: "low",
    stress: "high",
    fixedCommitments: "Work shift 1–8pm today, class 9–12 tomorrow",
  },
  assignments: [
    {
      id: crypto.randomUUID(),
      name: "Term paper — final draft",
      course: "HIST 305",
      dueAt: isoIn(22),
      hoursRemaining: 8,
      weight: 30,
      progress: 15,
      difficulty: "hard",
      notes: "Thesis still unclear, need sources.",
    },
    {
      id: crypto.randomUUID(),
      name: "Calculus midterm prep",
      course: "MATH 241",
      dueAt: isoIn(36),
      hoursRemaining: 6,
      weight: 35,
      progress: 10,
      difficulty: "hard",
      notes: "Haven't reviewed integration techniques yet.",
    },
    {
      id: crypto.randomUUID(),
      name: "Programming assignment 4",
      course: "CS 200",
      dueAt: isoIn(14),
      hoursRemaining: 5,
      weight: 15,
      progress: 25,
      difficulty: "hard",
      notes: "Recursion edge cases failing.",
    },
    {
      id: crypto.randomUUID(),
      name: "Spanish oral presentation",
      course: "SPAN 120",
      dueAt: isoIn(30),
      hoursRemaining: 3,
      weight: 10,
      progress: 0,
      difficulty: "medium",
      notes: "Need to write and rehearse.",
    },
  ],
};

export const allTests = [normalWorkloadTest, messyInputTest, overloadFailureTest];
