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
              Issue
            </dt>
            <dd className="mt-0.5 whitespace-pre-line leading-relaxed">
              {jobRow.notes ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

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
