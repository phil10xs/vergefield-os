import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Notice, PageHeader } from "@/components/layout/page-header";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ReportCelebration } from "@/components/request/report-celebration";
import { stepJobStatusAction } from "@/app/actions/requests";
import { sessionAddress } from "@/lib/sessions";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Your Home/Property's Issues & Bills Tracker Board",
};

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; celebrate?: string }>;
}) {
  const { property, celebrate } = await searchParams;

  if (!property) {
    const rows = await db
      .select({
        propertyAddress: job.propertyAddress,
        siteName: job.siteName,
      })
      .from(job)
      .orderBy(asc(job.createdAt));
    const addresses = [
      ...new Set(
        rows.map((row) => row.propertyAddress ?? row.siteName ?? "Unknown"),
      ),
    ];
    return (
      <AppShell>
        <PageHeader
          eyebrow="Tracker board"
          title="Your Home/Property's Issues & Bills Tracker Board"
          description="Pick a property to see its board."
          meta={`${addresses.length} ${addresses.length === 1 ? "property" : "properties"}`}
          backHref="/request"
          backLabel="Back to check-in"
          actions={
            <Link href="/request" className="flex w-full">
              <Button variant="accent" className="w-full">
                New check-in
              </Button>
            </Link>
          }
        />
        <ul className="space-y-2">
          {addresses.map((address) => (
            <li key={address}>
              <Link
                href={`/board?property=${encodeURIComponent(address)}`}
                className="block rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-secondary/50"
              >
                {address}
              </Link>
            </li>
          ))}
        </ul>
      </AppShell>
    );
  }

  const jobs = await db
    .select()
    .from(job)
    .where(eq(job.propertyAddress, property))
    .orderBy(asc(job.createdAt));
  const title = jobs.length > 0 ? sessionAddress(jobs[0]!) : property;
  const parked = jobs.filter(
    (entry) => !COLUMNS.some((column) => column.key === entry.status),
  );

  return (
    <AppShell>
      <ReportCelebration active={celebrate === "1"} />
      <PageHeader
        eyebrow="Tracker board"
        title={title}
        description="Your Home/Property's Issues & Bills Tracker Board for this property — tap ‹ › to move issues along."
        meta={`${jobs.length} ${jobs.length === 1 ? "session" : "sessions"}`}
        backHref="/track"
        backLabel="Back to snag list"
        actions={
          <Link href="/request" className="flex w-full">
            <Button variant="accent" className="w-full">
              New check-in
            </Button>
          </Link>
        }
      />

      {celebrate === "1" ? (
        <Notice title="Issue moved to Completed.">
          One more fix off the list.
        </Notice>
      ) : null}

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
                    {card.source === "public" ? (
                      <Link
                        href={`/request/${card.id}`}
                        className="block text-sm font-semibold leading-snug hover:underline"
                      >
                        {card.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold leading-snug">
                        {card.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {card.tradesmanTrade ?? "Trade detecting…"}
                      {card.costBand ? ` · likely ${card.costBand}` : ""}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2">
                      <JobStatusBadge status={card.status} />
                      <JobPaymentBadge
                        status={card.paymentStatus}
                        amountPence={card.paymentAmount}
                      />
                    </p>
                    <div className="mt-2 flex gap-2">
                      {card.status !== "requested" ? (
                        <form action={stepJobStatusAction}>
                          <input type="hidden" name="jobId" value={card.id} />
                          <input type="hidden" name="direction" value="prev" />
                          <input
                            type="hidden"
                            name="property"
                            value={property}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            aria-label={`Move ${card.title} back`}
                          >
                            ‹
                          </Button>
                        </form>
                      ) : null}
                      <form action={stepJobStatusAction} className="flex-1">
                        <input type="hidden" name="jobId" value={card.id} />
                        <input type="hidden" name="direction" value="next" />
                        <input
                          type="hidden"
                          name="property"
                          value={property}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          aria-label={`Move ${card.title} forward`}
                        >
                          ›
                        </Button>
                      </form>
                    </div>
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
    </AppShell>
  );
}
