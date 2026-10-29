import Link from "next/link";
import { EmptyState } from "@/components/layout/page-header";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { groupSessionsByPropertyVisit } from "@/lib/sessions";
import type { Job } from "@/db/schema";

export function TrackList({ jobs }: { jobs: Job[] }) {
  const groups = groupSessionsByPropertyVisit(jobs);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Record a check-in and its sessions will line up here."
        href="/request"
        actionLabel="Record a check-in"
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.address}
          aria-label={group.address}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-3">
            <h2 className="font-display text-base font-bold tracking-tight">
              {group.address}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {group.sessionCount}{" "}
              {group.sessionCount === 1 ? "session" : "sessions"}
            </span>
          </div>
          {group.visits.map((visit) => (
            <div key={visit.day} className="border-b border-border/60 last:border-0">
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Visit · {visit.label}
              </p>
              <ul className="divide-y divide-border/60">
                {visit.sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/jobs/${session.id}`}
                      className="flex flex-col gap-2 px-4 py-3 hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {session.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {session.tradesmanTrade ?? "Trade detecting…"}
                          {session.tradesmanName
                            ? ` · ${session.tradesmanName}`
                            : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <JobPaymentBadge
                          status={session.paymentStatus}
                          amountPence={session.paymentAmount}
                        />
                        <JobStatusBadge status={session.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
