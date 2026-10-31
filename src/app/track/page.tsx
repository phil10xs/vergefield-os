import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Notice, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TrackBoard } from "@/components/track/track-board";
import { TrackList } from "@/components/track/track-list";
import { ReportCelebration } from "@/components/request/report-celebration";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Track" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; paid?: string; celebrate?: string }>;
}) {
  const { view, paid, celebrate } = await searchParams;
  const current = view === "list" ? "list" : "board";
  const jobs = await db.select().from(job).orderBy(asc(job.createdAt));

  return (
    <AppShell>
      <ReportCelebration active={paid === "1" || celebrate === "1"} />
      <PageHeader
        title="Track"
        description="Every property's visits, as a snag list or a board."
        meta={`${jobs.length} ${jobs.length === 1 ? "session" : "sessions"}`}
        actions={
          <Link href="/request" className="flex w-full">
            <Button variant="accent" className="w-full">
              New check-in
            </Button>
          </Link>
        }
      />

      {paid === "1" ? (
        <Notice title="Your payment has been confirmed.">
          The issue now shows as Paid on the board.
        </Notice>
      ) : null}

      {celebrate === "1" ? (
        <Notice title="Issue moved to Completed.">
          One more fix off the list.
        </Notice>
      ) : null}

      <nav
        aria-label="Track view"
        className="mb-6 grid grid-cols-2 gap-2 sm:max-w-xs"
      >
        <Link href="/track?view=list" className="flex">
          <Button
            className="w-full"
            variant={current === "list" ? "accent" : "outline"}
          >
            List
          </Button>
        </Link>
        <Link href="/track?view=board" className="flex">
          <Button
            className="w-full"
            variant={current === "board" ? "accent" : "outline"}
          >
            Board
          </Button>
        </Link>
      </nav>

      {current === "board" ? (
        <TrackBoard jobs={jobs} />
      ) : (
        <TrackList jobs={jobs} />
      )}
    </AppShell>
  );
}
