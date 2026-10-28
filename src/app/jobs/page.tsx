import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import { EmptyState } from "@/components/layout/page-header";
import { JobTable } from "@/components/jobs/job-table";
import { db } from "@/db";
import { job } from "@/db/schema";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const jobs = await db.select().from(job).orderBy(desc(job.createdAt));

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title="Jobs"
        description="Work orders across every site. Chat-to-action will create and dispatch these."
        icon={ClipboardList}
        count={jobs.length}
        countLabel={jobs.length === 1 ? "job" : "jobs"}
        secondaryHref="/"
        secondaryLabel="Back home"
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Run the demo seed to load sample site jobs."
        />
      ) : (
        <JobTable jobs={jobs} />
      )}
    </main>
  );
}
