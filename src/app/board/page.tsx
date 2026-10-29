import Link from "next/link";
import type { Metadata } from "next";
import { KanbanSquare } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { sessionAddress } from "@/lib/sessions";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Property fixes board" };

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "resolved", label: "Resolved" },
] as const;

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property } = await searchParams;

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
      <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
        <ListHero
          title="Property fixes board"
          description="Pick a property to see its fixes across the board."
          icon={KanbanSquare}
          count={addresses.length}
          countLabel={addresses.length === 1 ? "property" : "properties"}
          actionHref="/request"
          actionLabel="New check-in"
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
      </main>
    );
  }

  const jobs = await db
    .select()
    .from(job)
    .where(eq(job.propertyAddress, property))
    .orderBy(asc(job.createdAt));
  const title = jobs.length > 0 ? sessionAddress(jobs[0]!) : property;

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title={title}
        description="Read-only view of this property's fixes — newest visits first on the report."
        icon={KanbanSquare}
        count={jobs.length}
        countLabel={jobs.length === 1 ? "session" : "sessions"}
        actionHref="/request"
        actionLabel="New check-in"
      />

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
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2">
                      <JobStatusBadge status={card.status} />
                      <JobPaymentBadge
                        status={card.paymentStatus}
                        amountPence={card.paymentAmount}
                      />
                    </p>
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
      <p className="mt-3 text-xs text-muted-foreground">
        Read-only view — statuses update from the visit report.
      </p>
    </main>
  );
}
