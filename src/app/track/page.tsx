import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardCheck, KanbanSquare } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import { Button } from "@/components/ui/button";
import { TrackBoard } from "@/components/track/track-board";
import { TrackList } from "@/components/track/track-list";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Track" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const current = view === "board" ? "board" : "list";
  const jobs = await db.select().from(job).orderBy(asc(job.createdAt));

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title="Track"
        description="Every property's visits and sessions — as a snag list or a tracker board."
        icon={current === "board" ? KanbanSquare : ClipboardCheck}
        count={jobs.length}
        countLabel={jobs.length === 1 ? "session" : "sessions"}
        actionHref="/request"
        actionLabel="New check-in"
      />

      <nav aria-label="Track view" className="mb-4 flex gap-2">
        <Link href="/track?view=list">
          <Button size="sm" variant={current === "list" ? "accent" : "outline"}>
            List
          </Button>
        </Link>
        <Link href="/track?view=board">
          <Button size="sm" variant={current === "board" ? "accent" : "outline"}>
            Board
          </Button>
        </Link>
      </nav>

      {current === "board" ? (
        <TrackBoard jobs={jobs} />
      ) : (
        <TrackList jobs={jobs} />
      )}
    </main>
  );
}
