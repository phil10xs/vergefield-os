import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobPaymentBadge, JobPriorityBadge } from "@/components/ui/status-badge";
import {
  markPaidAction,
  moveBoardIssueAction,
  saveBoardIssueAmountAction,
  savePaymentDecisionAction,
  setJobStatusAction,
} from "@/app/actions/requests";
import type { Job } from "@/db/schema";

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
] as const;

const ALL_STATUSES = [...COLUMNS, { key: "cancelled", label: "Cancelled" }] as const;

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function TrackBoard({
  jobs,
  boardToken,
  propertyKey,
  backHref = "/request",
  backLabel = "Back to check-in",
}: {
  jobs: Job[];
  boardToken?: string;
  propertyKey?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const linked = Boolean(boardToken && propertyKey);
  const parked = jobs.filter(
    (entry) => !COLUMNS.some((column) => column.key === entry.status),
  );

  return (
    <>
      <div className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 min-[1100px]:grid min-[1100px]:grid-cols-4 min-[1100px]:items-start min-[1100px]:overflow-visible">
        {COLUMNS.map((column) => {
          const cards = jobs.filter((entry) => entry.status === column.key);
          return (
            <section
              key={column.key}
              aria-label={column.label}
              className="flex w-[min(19rem,85%)] shrink-0 snap-start flex-col rounded-2xl border border-border bg-secondary/40 p-3 min-[1100px]:w-auto min-[1100px]:min-w-0 min-[1100px]:shrink"
            >
              <h2 className="flex items-center justify-between gap-2 px-1 pb-3 text-base font-semibold tracking-tight">
                <span className="min-w-0">{column.label}</span>
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {cards.length}
                </span>
              </h2>
              <div className="space-y-3">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className="min-w-0 rounded-xl border border-border bg-card p-4"
                  >
                    {card.source === "public" ? (
                      <Link
                        href={`/request/${card.id}`}
                        className="block break-words text-sm font-semibold leading-snug hover:underline"
                      >
                        {card.title}
                      </Link>
                    ) : (
                      <p className="break-words text-sm font-semibold leading-snug">
                        {card.title}
                      </p>
                    )}
                    <p className="mt-2 break-words rounded-lg bg-secondary px-2.5 py-1.5 text-sm text-secondary-foreground">
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
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground">Trade</dt>
                        <dd className="min-w-0 text-right font-medium break-words">
                          {card.tradesmanTrade ?? "Detecting…"}
                        </dd>
                      </div>
                      {card.costBand ? (
                        <div className="flex items-start justify-between gap-3">
                          <dt className="text-muted-foreground">Likely cost</dt>
                          <dd className="text-right font-medium">
                            {card.costBand}
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground">Assigned</dt>
                        <dd className="min-w-0 text-right font-medium break-words">
                          {card.tradesmanName ?? card.assignee ?? "Unassigned"}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground">Visit</dt>
                        <dd className="font-medium">
                          {formatDay(card.createdAt)}
                        </dd>
                      </div>
                    </dl>
                    {linked ? (
                      <>
                        <div className="mt-3 flex gap-2">
                          {card.status !== "requested" ? (
                            <form action={moveBoardIssueAction}>
                              <input type="hidden" name="token" value={boardToken} />
                              <input
                                type="hidden"
                                name="propertyKey"
                                value={propertyKey}
                              />
                              <input type="hidden" name="jobId" value={card.id} />
                              <input type="hidden" name="direction" value="prev" />
                              <Button
                                type="submit"
                                variant="outline"
                                className="h-11 w-11 shrink-0 px-0"
                                aria-label={`Move ${card.title} back`}
                              >
                                <ChevronLeft className="h-5 w-5" aria-hidden />
                              </Button>
                            </form>
                          ) : null}
                          {card.status !== "paid" ? (
                            <form
                              action={moveBoardIssueAction}
                              className="min-w-0 flex-1"
                            >
                              <input type="hidden" name="token" value={boardToken} />
                              <input
                                type="hidden"
                                name="propertyKey"
                                value={propertyKey}
                              />
                              <input type="hidden" name="jobId" value={card.id} />
                              <input type="hidden" name="direction" value="next" />
                              <Button
                                type="submit"
                                variant="outline"
                                className="h-11 w-full px-0"
                                aria-label={`Move ${card.title} forward`}
                              >
                                <ChevronRight className="h-5 w-5" aria-hidden />
                              </Button>
                            </form>
                          ) : null}
                        </div>
                        {card.status === "completed" ? (
                          <form action={moveBoardIssueAction} className="mt-2">
                            <input type="hidden" name="token" value={boardToken} />
                            <input
                              type="hidden"
                              name="propertyKey"
                              value={propertyKey}
                            />
                            <input type="hidden" name="jobId" value={card.id} />
                            <input type="hidden" name="direction" value="next" />
                            <Button
                              type="submit"
                              variant="accent"
                              className="w-full"
                            >
                              Pay now
                            </Button>
                          </form>
                        ) : null}
                        <form
                          action={saveBoardIssueAmountAction}
                          className="mt-2 flex gap-2"
                        >
                          <input type="hidden" name="token" value={boardToken} />
                          <input
                            type="hidden"
                            name="propertyKey"
                            value={propertyKey}
                          />
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
                            aria-label={`Price for ${card.title}`}
                            className="text-field min-w-0 flex-1"
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="h-11 shrink-0 px-4"
                          >
                            Save
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form
                        action={setJobStatusAction}
                        className="mt-3 flex flex-col gap-2"
                      >
                        <input type="hidden" name="jobId" value={card.id} />
                        <select
                          name="status"
                          defaultValue={card.status}
                          aria-label={`Move ${card.title} to`}
                          className="text-field"
                        >
                          {ALL_STATUSES.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="outline" className="w-full">
                          Move
                        </Button>
                      </form>
                    )}
                    {!linked && card.status === "completed" ? (
                      <form action={markPaidAction} className="mt-2">
                        <input type="hidden" name="jobId" value={card.id} />
                        <Button
                          type="submit"
                          variant="accent"
                          className="w-full"
                        >
                          Pay Tradesman
                        </Button>
                      </form>
                    ) : null}
                    {!linked && card.paymentStatus !== "sent" ? (
                      <form
                        action={savePaymentDecisionAction}
                        className="mt-2 flex flex-col gap-2"
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
                          className="text-field"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="submit"
                            name="decision"
                            value="due"
                            variant="outline"
                            className="w-full"
                          >
                            Due
                          </Button>
                          <Button
                            type="submit"
                            name="decision"
                            value="sent"
                            variant="outline"
                            className="w-full"
                          >
                            Sent
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                ))}
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                    Nothing here yet.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {parked.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {parked.length} parked outside the board (
          {[...new Set(parked.map((entry) => entry.status))].join(", ")}).
        </p>
      ) : null}
      <p className="mt-6 text-center text-sm">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center font-semibold text-link hover:underline"
        >
          {backLabel}
        </Link>
      </p>
    </>
  );
}
