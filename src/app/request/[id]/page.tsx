import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobStatusBadge } from "@/components/ui/status-badge";
import { getPublicJob } from "@/server/reporting";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Track your request" };

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobRow = await getPublicJob(id);
  if (!jobRow || jobRow.source !== "public") notFound();
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, id))
    .orderBy(asc(siteMedia.createdAt));
  const reference = jobRow.id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-xl px-[var(--app-gutter)] py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Request {reference}
      </p>
      <h1 className="mt-1 font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
        {jobRow.title}
      </h1>
      <div className="mt-3">
        <JobStatusBadge status={jobRow.status} />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Property
            </dt>
            <dd className="mt-0.5 font-medium">
              {jobRow.propertyAddress ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detected trade
            </dt>
            <dd className="mt-0.5 font-medium">
              {jobRow.tradesmanTrade ?? "Detecting…"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Issue
            </dt>
            <dd className="mt-0.5 whitespace-pre-line leading-relaxed">
              {jobRow.notes || "See photos and video."}
            </dd>
          </div>
        </dl>
      </div>

      {media.some((row) => row.transcript || row.visualDescription) ? (
        <section aria-label="Video analysis" className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            What your video says
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
      ) : (
        <p className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {media.some((row) => row.kind === "video")
            ? "Video received — transcription lands here once processed, otherwise the team listens to the voice on your video directly."
            : "No video attached — the team works from your note and photos."}
        </p>
      )}

      {media.length > 0 ? (
        <section aria-label="Your captures" className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            Your photos and videos ({media.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-6 text-sm text-muted-foreground">
        The trade team reviews every request in turn. Urgent issues go first —
        for emergencies, call the number on your tenancy agreement.
      </p>
    </main>
  );
}
