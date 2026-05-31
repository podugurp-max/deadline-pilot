import { Bot } from "lucide-react";
import type { AgentTrace } from "@/lib/recovery-engine";

export function AgentTraceView({ trace }: { trace: AgentTrace[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Bot className="h-4 w-4" />
        Agent workflow trace
      </h3>
      <ol className="relative space-y-4 border-l border-border pl-5">
        {trace.map((t, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="text-sm font-semibold text-foreground">{t.agent}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t.output}</p>
            {t.details && t.details.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-lg bg-muted/60 p-3 text-xs text-foreground">
                {t.details.map((d, j) => (
                  <li key={j} className="font-mono">
                    › {d}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
