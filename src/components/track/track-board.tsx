import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobPaymentBadge, JobPriorityBadge } from "@/components/ui/status-badge";
import {
  savePaymentDecisionAction,
  setJobStatusAction,
} from "@/app/actions/jobs";
import type { Job } from "@/db/schema";

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "resolved", label: "Resolved" },
] as const;

const ALL_STATUSES = [...COLUMNS, { key: "cancelled", label: "Cancelled" }] as const;

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

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
              <div className="space-y-3">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    {card.source === "public" ? (
                      <Link
                        href={`/request/${card.id}`}
                        className="block text-sm font-bold leading-snug hover:underline"
                      >
                        {card.title}
                      </Link>
                    ) : (
                      <p className="block text-sm font-bold leading-snug">
                        {card.title}
                      </p>
                    )}
                    <p className="mt-2 truncate rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground">
                      {card.propertyAddress ??
                        card.siteName ??
                        "Unassigned site"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <JobPriorityBadge priority={card.priority} />
                      <JobPaymentBadge
                        status={card.paymentStatus}
                        amountPence={card.paymentAmount}
                      />
                    </div>
                    <dl className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {card.tradesmanTrade ?? "Trade detecting…"}
                        </dt>
                        <dd className="truncate font-semibold">
                          {card.tradesmanName ?? card.assignee ?? "Unassigned"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Visit</dt>
                        <dd className="font-semibold">
                          {formatDay(card.createdAt)}
                        </dd>
                      </div>
                    </dl>
                    <form
                      action={setJobStatusAction}
                      className="mt-3 flex gap-2"
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
                    {card.paymentStatus === "sent" ? null : (
                      <form
                        action={savePaymentDecisionAction}
                        className="mt-2 flex gap-2"
                      >
                        <input type="hidden" name="jobId" value={card.id} />
                        <input
                          name="amount"
                          inputMode="decimal"
                          defaultValue={
                            card.paymentAmount
                              ? (card.paymentAmount / 100).toString()
                              : ""
                          }
                          placeholder="£"
                          aria-label={`Payment amount for ${card.title}`}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Button
                          type="submit"
                          name="decision"
                          value="due"
                          size="sm"
                          variant="outline"
                        >
                          Due
                        </Button>
                        <Button
                          type="submit"
                          name="decision"
                          value="sent"
                          size="sm"
                          variant="outline"
                        >
                          Sent
                        </Button>
                      </form>
                    )}
                  </article>
                ))}
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nothing here yet.
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
