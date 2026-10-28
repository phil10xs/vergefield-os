import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { StageSteps } from "@/components/jobs/stage-steps";
import { JobStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { REPORT_SECTIONS } from "@/lib/checklist-template";
import { getLatestReport } from "@/server/reporting";
import { db } from "@/db";
import { job, siteMedia } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Report" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jobRow] = await db.select().from(job).where(eq(job.id, id));
  if (!jobRow) notFound();
  const report = await getLatestReport(id);
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, id))
    .orderBy(asc(siteMedia.createdAt));

  if (!report) {
    return (
      <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
        <PageHeader
          title={`Report — ${jobRow.title}`}
          description="No report has been generated for this job yet."
          backHref={`/jobs/${jobRow.id}/checklist`}
        />
        <StageSteps current="report" />
        <EmptyState
          title="No report yet"
          description="Complete the checklist and generate the report to see it here."
          href={`/jobs/${jobRow.id}/checklist`}
          actionLabel="Open checklist"
        />
      </main>
    );
  }

  const sections = [
    { key: "site_condition", body: report.siteCondition },
    { key: "hazards", body: report.hazards },
    { key: "materials", body: report.materials },
    { key: "next_steps", body: report.nextSteps },
  ].map((entry) => ({
    ...entry,
    label:
      REPORT_SECTIONS.find((section) => section.key === entry.key)?.label ??
      entry.key,
  }));

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <PageHeader
        title={`Site report — ${jobRow.title}`}
        description={[
          jobRow.siteName ? `Site: ${jobRow.siteName}` : null,
          jobRow.tradesmanName
            ? `Tradesman: ${jobRow.tradesmanName}${jobRow.tradesmanTrade ? ` (${jobRow.tradesmanTrade})` : ""}`
            : null,
          report.author ? `Owner: ${report.author}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        backHref={`/jobs/${jobRow.id}`}
      />
      <StageSteps current="report" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <JobStatusBadge status={jobRow.status} />
        <span className="text-sm text-muted-foreground">{report.notes}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.key}
            aria-label={section.label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <h2 className="font-display text-base font-bold tracking-tight">
              {section.label}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {section.body || "Nothing recorded."}
            </p>
          </section>
        ))}
      </div>

      {media.length > 0 ? (
        <section aria-label="Report captures" className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            Captures ({media.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((row) => (
              <figure
                key={row.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {row.kind === "video" ? (
                  <video
                    src={`/api/media/${row.id}`}
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${row.id}`}
                    alt={row.filename}
                    className="aspect-video w-full object-cover"
                  />
                )}
                {row.narration ? (
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {row.narration}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href={`/jobs/${jobRow.id}/checklist`}>
          <Button variant="outline" className="w-full sm:w-auto">
            Revise checklist
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="accent" className="w-full sm:w-auto">
            Back to jobs
          </Button>
        </Link>
      </div>
    </main>
  );
}
