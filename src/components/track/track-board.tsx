import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobPaymentBadge } from "@/components/ui/status-badge";
import { setJobStatusAction } from "@/app/actions/jobs";
import type { Job } from "@/db/schema";

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "resolved", label: "Resolved" },
] as const;

const ALL_STATUSES = [...COLUMNS, { key: "cancelled", label: "Cancelled" }] as const;

export function TrackBoard({ jobs }: { jobs: Job[] }) {
  const parked = jobs.filter(
    (entry) => !COLUMNS.some((column) => column.key === entry.status),
  );

  return (
    <>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((column) => {
          const cards = jobs.filter((entry) => entry.status === column.key);
          return (
            <section
              key={column.key}
              aria-label={column.label}
              className="w-72 shrink-0 snap-start rounded-2xl border border-border bg-secondary/40 p-3"
            >
              <h2 className="flex items-center justify-between px-1 pb-2 font-display text-sm font-bold tracking-tight">
                {column.label}
                <span className="rounded-lg bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {cards.length}
                </span>
              </h2>
              <div className="space-y-2">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <Link
                      href={`/jobs/${card.id}`}
                      className="block text-sm font-semibold leading-snug hover:underline"
                    >
                      {card.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {card.propertyAddress ?? card.siteName ?? "Unassigned site"}
                      {card.tradesmanTrade ? ` · ${card.tradesmanTrade}` : ""}
                    </p>
                    <p className="mt-2">
                      <JobPaymentBadge
                        status={card.paymentStatus}
                        amountPence={card.paymentAmount}
                      />
                    </p>
                    <form
                      action={setJobStatusAction}
                      className="mt-2 flex gap-2"
                    >
                      <input type="hidden" name="jobId" value={card.id} />
                      <select
                        name="status"
                        defaultValue={card.status}
                        aria-label={`Move ${card.title} to`}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {ALL_STATUSES.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Move
                      </Button>
                    </form>
                  </article>
                ))}
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {parked.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {parked.length} parked outside the board (
          {[...new Set(parked.map((entry) => entry.status))].join(", ")}).
        </p>
      ) : null}
    </>
  );
}
