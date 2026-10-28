import { cn } from "@/lib/utils";

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

const toneClasses = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  success: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  warning: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  danger: "bg-destructive/15 text-destructive",
} as const;

type Tone = keyof typeof toneClasses;

function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold capitalize",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const jobStatusTone: Record<string, Tone> = {
  planned: "info",
  assigned: "info",
  accepted: "info",
  en_route: "warning",
  on_site: "warning",
  in_progress: "warning",
  submitted: "warning",
  approved: "success",
  completed: "success",
  blocked: "danger",
  rescheduled: "warning",
  rejected: "danger",
  cancelled: "neutral",
  scheduled: "info",
  done: "success",
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={jobStatusTone[status] ?? "neutral"}>{humanize(status)}</Badge>
  );
}

const jobPriorityTone: Record<string, Tone> = {
  high: "danger",
  medium: "info",
  low: "neutral",
};

export function JobPriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={jobPriorityTone[priority] ?? "neutral"}>
      {humanize(priority)} priority
    </Badge>
  );
}

export function JobAssignmentBadge({ assigned }: { assigned: boolean }) {
  return (
    <Badge tone={assigned ? "success" : "neutral"}>
      {assigned ? "Assigned" : "Unassigned"}
    </Badge>
  );
}
