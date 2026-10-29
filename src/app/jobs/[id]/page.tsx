import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { recordPaymentAction, triageRequestAction } from "@/app/actions/jobs";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  JobPaymentBadge,
  JobPriorityBadge,
  JobSourceBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { getLatestReport } from "@/server/reporting";
import { db } from "@/db";
import { checklistItem, job, siteMedia } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Job details" };

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jobRow] = await db.select().from(job).where(eq(job.id, id));
  if (!jobRow) notFound();
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, id))
    .orderBy(asc(siteMedia.createdAt));
  const items = await db
    .select()
    .from(checklistItem)
    .where(eq(checklistItem.jobId, id));
  const report = await getLatestReport(id);
  const done = items.filter((item) => item.checked).length;
  const isRequest = jobRow.status === "requested";

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <PageHeader
        title={jobRow.title}
        description={jobRow.siteName ? `Site: ${jobRow.siteName}` : undefined}
        backHref="/jobs"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <JobSourceBadge source={jobRow.source} />
        <JobStatusBadge status={jobRow.status} />
        <JobPriorityBadge priority={jobRow.priority} />
      </div>

      <section
        aria-label="Payment"
        className="mb-6 rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold tracking-tight">
            Payment{jobRow.tradesmanName ? ` · ${jobRow.tradesmanName}` : ""}
          </h2>
          <JobPaymentBadge
            status={
              jobRow.paymentStatus === "none" && jobRow.paymentAmount
                ? "due"
                : jobRow.paymentStatus
            }
            amountPence={jobRow.paymentAmount}
          />
        </div>
        {jobRow.paymentStatus === "sent" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Simulated payment sent — no real money moves in this demo.
          </p>
        ) : (
          <form
            action={recordPaymentAction}
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="jobId" value={jobRow.id} />
            <label className="block max-w-xs">
              <span className="mb-1 block text-sm font-semibold">
                Amount (£)
              </span>
              <input
                name="amount"
                inputMode="decimal"
                required
                defaultValue={
                  jobRow.paymentAmount
                    ? (jobRow.paymentAmount / 100).toString()
                    : ""
                }
                placeholder="e.g. 180"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Button type="submit" variant="accent" className="w-full sm:w-auto">
              Mark payment sent
            </Button>
          </form>
        )}
        {jobRow.paymentStatus !== "sent" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Simulated — no real money moves in this demo.
          </p>
        ) : null}
      </section>

      {isRequest ? (
        <section
          aria-label="Triage check-in"
          className="mb-6 rounded-2xl border border-border bg-card p-4"
        >
          <h2 className="font-display text-base font-bold tracking-tight">
            New check-in — accept or decline
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <form action={triageRequestAction} className="space-y-3">
              <input type="hidden" name="jobId" value={jobRow.id} />
              <input type="hidden" name="decision" value="accept" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Confirm title
                  </span>
                  <input
                    name="title"
                    defaultValue={jobRow.title}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Confirm trade
                  </span>
                  <input
                    name="trade"
                    defaultValue={jobRow.tradesmanTrade ?? ""}
                    placeholder="e.g. Plumber"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              </div>
              <Button type="submit" variant="accent" className="w-full sm:w-auto">
                Accept into schedule
              </Button>
            </form>
            <form action={triageRequestAction}>
              <input type="hidden" name="jobId" value={jobRow.id} />
              <input type="hidden" name="decision" value="decline" />
              <Button
                type="submit"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Decline
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-label="Job facts"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <h2 className="font-display text-base font-bold tracking-tight">
            Details
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Fact label="Site" value={jobRow.siteName ?? "—"} />
            <Fact
              label="Tradesman"
              value={
                jobRow.tradesmanName
                  ? `${jobRow.tradesmanName}${jobRow.tradesmanTrade ? ` (${jobRow.tradesmanTrade})` : ""}`
                  : (jobRow.tradesmanTrade ?? "Not assigned")
              }
            />
            <Fact label="Assignee" value={jobRow.assignee ?? "Unassigned"} />
            <Fact
              label="Checklist"
              value={items.length ? `${done}/${items.length} complete` : "—"}
            />
          </dl>
          {jobRow.notes ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
              {jobRow.notes}
            </p>
          ) : null}
        </section>

        {jobRow.source === "public" ? (
          <section
            aria-label="Requester"
            className="rounded-2xl border border-border bg-card p-4"
          >
            <h2 className="font-display text-base font-bold tracking-tight">
              Requested by
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Fact label="Name" value={jobRow.requesterName ?? "—"} />
              <Fact label="Contact" value={jobRow.requesterContact ?? "—"} />
              <Fact label="Address" value={jobRow.propertyAddress ?? "—"} />
            </dl>
          </section>
        ) : null}

        <section
          aria-label="Workflow stages"
          className="rounded-2xl border border-border bg-card p-4 lg:col-span-2"
        >
          <h2 className="font-display text-base font-bold tracking-tight">
            Workflow
          </h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={`/jobs/${jobRow.id}/capture`}>
              <Button variant="outline" className="w-full sm:w-auto">
                Capture
              </Button>
            </Link>
            <Link href={`/jobs/${jobRow.id}/checklist`}>
              <Button variant="outline" className="w-full sm:w-auto">
                Checklist
              </Button>
            </Link>
            <Link href={`/jobs/${jobRow.id}/report`}>
              <Button variant="accent" className="w-full sm:w-auto">
                {report ? "View report" : "Report"}
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {media.some((row) => row.transcript || row.visualDescription) ? (
        <section aria-label="Video analysis" className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            What Meta saw
          </h2>
          <div className="space-y-3">
            {media
              .filter((row) => row.transcript || row.visualDescription)
              .map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed"
                >
                  {row.transcript ? (
                    <p className="whitespace-pre-line">
                      <strong className="font-semibold">Heard: </strong>
                      {row.transcript}
                    </p>
                  ) : null}
                  {row.visualDescription ? (
                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                      <strong className="font-semibold text-foreground">
                        Seen:{" "}
                      </strong>
                      {row.visualDescription}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Original captures" className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
          Captures ({media.length})
        </h2>
        {media.length === 0 ? (
          <EmptyState
            title="No captures yet"
            description="Photos and videos appear here once the site is captured."
            href={`/jobs/${jobRow.id}/capture`}
            actionLabel="Open capture"
          />
        ) : (
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
                <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                  {row.kind} · {(row.sizeBytes / 1024).toFixed(0)} KB
                  {row.narration ? ` · ${row.narration}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
