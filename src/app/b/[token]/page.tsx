import Link from "next/link";
import type { Metadata } from "next";
import { KanbanSquare, Link2Off } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getBoardJob } from "@/server/board-access";
import { sessionAddress } from "@/lib/sessions";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Tracker board" };

const COLUMNS = [
  { key: "requested", label: "Requested" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "resolved", label: "Resolved" },
] as const;

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const anchor = await getBoardJob(token);

  if (!anchor) {
    return (
      <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Link2Off
            className="mx-auto h-10 w-10 text-muted-foreground"
            aria-hidden
          />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            This link has expired
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Board links last 7 days. Ask for a fresh one from your visit
            report — no account needed.
          </p>
          <div className="mt-5">
            <Link href="/request">
              <Button variant="accent" className="w-full sm:w-auto">
                Start a check-in
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const address = sessionAddress(anchor);
  const jobs =
    anchor.propertyAddress || anchor.siteName
      ? await db
          .select()
          .from(job)
          .where(
            anchor.propertyAddress
              ? eq(job.propertyAddress, anchor.propertyAddress)
              : eq(job.siteName, anchor.siteName!),
          )
          .orderBy(asc(job.createdAt))
      : [anchor];

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title={address}
        description="Live tracker for this property — the trade team updates it as work moves."
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
        Read-only view — this link expires 7 days after it was sent.
      </p>
    </main>
  );
}
