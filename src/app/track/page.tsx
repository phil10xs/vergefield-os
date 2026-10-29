import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import { TrackList } from "@/components/track/track-list";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Track" };

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const jobs = await db.select().from(job).orderBy(asc(job.createdAt));

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title="Track"
        description="Every property's visits and sessions — as a snag list."
        icon={ClipboardCheck}
        count={jobs.length}
        countLabel={jobs.length === 1 ? "session" : "sessions"}
        actionHref="/request"
        actionLabel="New check-in"
      />

      <TrackList jobs={jobs} />
    </main>
  );
}
