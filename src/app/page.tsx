import Link from "next/link";
import { ClipboardList, HardHat } from "lucide-react";
import { ListHero } from "@/components/layout/list-overview";
import { EmptyState } from "@/components/layout/page-header";
import { JobTable } from "@/components/jobs/job-table";
import { brand } from "@/brand";
import { db } from "@/db";
import { job } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function HomePage() {
  const jobs = await db
    .select()
    .from(job)
    .orderBy(desc(job.createdAt))
    .limit(5);

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <ListHero
        title={brand.name}
        description={brand.description}
        icon={HardHat}
        count={jobs.length}
        countLabel={jobs.length === 1 ? "recent job" : "recent jobs"}
        actionHref="/jobs"
        actionLabel="View all jobs"
        secondaryHref="/api/health"
        secondaryLabel="Health check"
      />

      <section aria-label="Jobs on site">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <h2 className="font-display text-lg font-bold tracking-tight">
            Latest jobs
          </h2>
        </div>
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description="Seed the demo data or push the schema, then reload to see site jobs here."
          />
        ) : (
          <JobTable jobs={jobs} />
        )}
      </section>

      <section
        aria-label="Portals"
        className="mt-8 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-display text-base font-bold tracking-tight">
          Two doors
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <Link href="/jobs" className="font-semibold text-link hover:underline">
              Trade dashboard
            </Link>{" "}
            — triage requests, capture the site, and generate reports.
          </li>
          <li>
            <Link href="/request" className="font-semibold text-link hover:underline">
              Public request
            </Link>{" "}
            — owners and tenants report an issue with photos, video, or voice.
          </li>
        </ul>
      </section>
    </main>
  );
}
