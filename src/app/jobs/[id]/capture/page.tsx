import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { saveCaptureAction } from "@/app/actions/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { StageSteps } from "@/components/jobs/stage-steps";
import { NarrationField } from "@/components/capture/narration-field";
import { Button } from "@/components/ui/button";
import { TRADE_OPTIONS } from "@/lib/chat-parse";
import { db } from "@/db";
import { job, siteMedia } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Capture" };

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function CapturePage({
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
  const tradeValue = TRADE_OPTIONS.includes(
    (jobRow.tradesmanTrade ?? "") as (typeof TRADE_OPTIONS)[number],
  )
    ? (jobRow.tradesmanTrade as string)
    : "Other";

  return (
    <main className="mx-auto w-full max-w-[var(--app-page-max)] px-[var(--app-gutter)] py-8">
      <PageHeader
        title={jobRow.title}
        description={`Capture the site: record the tradesman, attach photos or video, and narrate what the camera sees.${jobRow.siteName ? ` Site: ${jobRow.siteName}.` : ""}`}
        backHref="/jobs"
      />
      <StageSteps current="capture" />

      <form
        action={saveCaptureAction}
        className="grid gap-6 lg:grid-cols-2"
      >
        <input type="hidden" name="jobId" value={jobRow.id} />
        <fieldset className="rounded-2xl border border-border bg-card p-4">
          <legend className="px-1 font-display text-base font-bold tracking-tight">
            Tradesman
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Name</span>
              <input
                name="tradesmanName"
                defaultValue={jobRow.tradesmanName ?? jobRow.assignee ?? ""}
                placeholder="e.g. Ama Mensah"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Trade</span>
              <select
                name="trade"
                defaultValue={tradeValue}
                className={inputClass}
              >
                {TRADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold">
              Other trade{" "}
              <span className="font-normal text-muted-foreground">
                (only if trade is Other)
              </span>
            </span>
            <input
              name="otherTrade"
              defaultValue={tradeValue === "Other" ? (jobRow.tradesmanTrade ?? "") : ""}
              placeholder="e.g. Steel fixer"
              className={inputClass}
            />
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-card p-4">
          <legend className="px-1 font-display text-base font-bold tracking-tight">
            Photos and video
          </legend>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Attach files
            </span>
            <input
              type="file"
              name="media"
              multiple
              accept="image/*,video/*"
              required={media.length === 0}
              className="w-full rounded-xl border border-dashed border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-secondary-foreground"
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Photos or one video, up to 50 MB per file. Files stay on this
            machine under uploads/.
          </p>
          <div className="mt-3">
            <span className="mb-1 block text-sm font-semibold">
              Spoken narration
            </span>
            <NarrationField />
          </div>
        </fieldset>

        <div className="lg:col-span-2">
          <Button type="submit" variant="accent" className="w-full sm:w-auto">
            Save capture and continue to checklist
          </Button>
        </div>
      </form>

      {media.length > 0 ? (
        <section aria-label="Attached captures" className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            Attached captures ({media.length})
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
                <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                  {row.kind} · {(row.sizeBytes / 1024).toFixed(0)} KB
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
