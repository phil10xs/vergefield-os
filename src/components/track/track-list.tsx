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
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight break-words">
                {group.address}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.sessionCount}{" "}
                {group.sessionCount === 1 ? "session" : "sessions"}
              </p>
            </div>
            <div className="w-full min-w-0 lg:w-80 lg:shrink-0">
              <Link
                href={`/board?property=${encodeURIComponent(group.address)}`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground"
              >
                View board
              </Link>
            </div>
          </div>
          {group.visits.map((visit) => (
            <div key={visit.day} className="border-b border-border/60 last:border-0">
              <p className="px-4 pt-3 text-sm font-semibold text-muted-foreground sm:px-5">
                Visit · {visit.label}
              </p>
              <ul className="divide-y divide-border/60">
                {visit.sessions.map((session) => (
                  <li key={session.id}>
                    {session.source === "public" ? (
                      <Link
                        href={`/request/${session.id}`}
                        className="flex min-h-14 flex-col gap-2 px-4 py-3.5 hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold break-words">
                            {session.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
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
                    ) : (
                      <div className="flex min-h-14 flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold break-words">
                            {session.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
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
                      </div>
                    )}
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
