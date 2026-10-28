import { cn } from "@/lib/utils";

const STAGES = [
  { key: "chat", label: "Jobs" },
  { key: "capture", label: "Capture" },
  { key: "checklist", label: "Checklist" },
  { key: "report", label: "Report" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export function StageSteps({ current }: { current: StageKey }) {
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2" aria-label="Progress">
      {STAGES.map((stage, index) => (
        <li key={stage.key} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold",
              index < currentIndex &&
                "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
              index === currentIndex && "bg-primary text-primary-foreground",
              index > currentIndex &&
                "bg-secondary text-secondary-foreground",
            )}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {index + 1}. {stage.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
