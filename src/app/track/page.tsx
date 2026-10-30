import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TrackList } from "@/components/track/track-list";
import { db } from "@/db";
import { job } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Track" };

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const jobs = await db.select().from(job).orderBy(asc(job.createdAt));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Track"
        title="Issues snag list"
        description="Every property's visits and sessions — as an Issues snag list."
        meta={`${jobs.length} ${jobs.length === 1 ? "session" : "sessions"}`}
        actions={
          <Link href="/request" className="flex w-full">
            <Button variant="accent" className="w-full">
              New check-in
            </Button>
          </Link>
        }
      />

      <TrackList jobs={jobs} />
    </AppShell>
  );
}
