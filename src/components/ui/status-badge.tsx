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
  requested: "info",
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

export function JobSourceBadge({ source }: { source: string }) {
  return (
    <Badge tone={source === "public" ? "info" : "neutral"}>
      {source === "public" ? "Public request" : "Internal"}
    </Badge>
  );
}

export function JobPaymentBadge({
  status,
  amountPence,
}: {
  status: string;
  amountPence: number | null;
}) {
  if (status !== "due" && status !== "sent") return null;
  const amount =
    typeof amountPence === "number"
      ? ` £${(amountPence / 100).toFixed(amountPence % 100 === 0 ? 0 : 2)}`
      : "";
  return (
    <Badge tone={status === "sent" ? "success" : "warning"}>
      {status === "sent" ? `Sent${amount}` : `Due${amount}`}
    </Badge>
  );
}
