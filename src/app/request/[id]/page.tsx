import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { BoardLinkRequest } from "@/components/request/board-link-request";
import { REPORT_SECTIONS } from "@/lib/checklist-template";
import {
  formatVisitDay,
  selectVisitSessions,
  sessionAddress,
  visitDayOf,
} from "@/lib/sessions";
import {
  generateReport,
  getLatestReport,
  getPublicJob,
} from "@/server/reporting";
import { db } from "@/db";
import { job, siteMedia, type Job } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export const metadata: Metadata = { title: "Visit report" };

function sectionLabel(key: string): string {
  return REPORT_SECTIONS.find((section) => section.key === key)?.label ?? key;
}

function visitStatus(sessions: Job[]): string {
  if (sessions.length > 0 && sessions.every((row) => row.status === "resolved"))
    return "resolved";
  const order = ["in_progress", "submitted", "planned", "requested"];
  for (const status of order) {
    if (sessions.some((row) => row.status === status)) return status;
  }
  return sessions[0]?.status ?? "requested";
}

export default async function PublicTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: fresh } = await searchParams;
  const anchor = await getPublicJob(id);
  if (!anchor || anchor.source !== "public") notFound();

  const siblings = anchor.propertyAddress
    ? await db
        .select()
        .from(job)
        .where(eq(job.propertyAddress, anchor.propertyAddress))
        .orderBy(asc(job.createdAt))
    : [anchor];
  const sessions = selectVisitSessions(siblings, anchor);
  const address = sessionAddress(anchor);
  const day = visitDayOf(anchor.createdAt);
  const reference = anchor.id.slice(0, 8).toUpperCase();

  const media =
    sessions.length > 0
      ? await db
          .select()
          .from(siteMedia)
          .where(
            inArray(
              siteMedia.jobId,
              sessions.map((row) => row.id),
            ),
          )
          .orderBy(asc(siteMedia.createdAt))
      : [];
  const mediaBySession = new Map<string, typeof media>();
  for (const row of media) {
    const list = mediaBySession.get(row.jobId) ?? [];
    list.push(row);
    mediaBySession.set(row.jobId, list);
  }

  const reports = new Map<string, Awaited<ReturnType<typeof getLatestReport>>>();
  for (const session of sessions) {
    const existing = await getLatestReport(session.id);
    if (existing || session.source !== "public") {
      reports.set(session.id, existing);
    } else {
      reports.set(
        session.id,
        await generateReport(session.id, session.requesterName ?? "VergeSnap", {
          markSubmitted: false,
        }),
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--app-gutter)] py-8">
      {fresh === "1" ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gv-teal-bright)]"
            aria-hidden
          />
          <div className="text-sm">
            <p className="font-semibold">
              Check-in received — reference {reference}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Bookmark this page — it is your private receipt. The trade team
              reviews every check-in in turn, urgent issues first.
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Visit report · {reference}
      </p>
      <h1 className="mt-1 font-display text-[length:var(--app-title-size)] font-bold tracking-tight">
        {address}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <JobStatusBadge status={visitStatus(sessions)} />
        <span className="text-sm text-muted-foreground">
          {formatVisitDay(day)} · {sessions.length}{" "}
          {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {sessions.map((session, index) => {
        const clips = mediaBySession.get(session.id) ?? [];
        const heard = clips
          .map((row) => row.transcript?.trim())
          .filter((value): value is string => Boolean(value));
        const seen = clips
          .map((row) => row.visualDescription?.trim())
          .filter((value): value is string => Boolean(value));
        const report = reports.get(session.id);
        const detail = report
          ? [
              { key: "site_condition", body: report.siteCondition },
              { key: "hazards", body: report.hazards },
              { key: "materials", body: report.materials },
              { key: "next_steps", body: report.nextSteps },
            ]
          : [];
        return (
          <section
            key={session.id}
            aria-label={`Session ${index + 1}: ${session.title}`}
            className="mt-8 border-t border-border pt-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Session {index + 1} of {sessions.length}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
              {session.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <JobStatusBadge status={session.status} />
              <JobPaymentBadge
                status={session.paymentStatus}
                amountPence={session.paymentAmount}
              />
            </div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 font-semibold">Trade:</dt>
                <dd>{session.tradesmanTrade ?? "Detecting…"}</dd>
              </div>
              {session.notes ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">Issue:</dt>
                  <dd className="whitespace-pre-line leading-relaxed">
                    {session.notes}
                  </dd>
                </div>
              ) : null}
              {heard.length > 0 ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">Heard:</dt>
                  <dd className="whitespace-pre-line leading-relaxed">
                    {heard.join(" ")}
                  </dd>
                </div>
              ) : null}
              {seen.length > 0 ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">Seen:</dt>
                  <dd className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {seen.join(" ")}
                  </dd>
                </div>
              ) : null}
              {heard.length === 0 && seen.length === 0 ? (
                <dd className="text-muted-foreground">
                  {clips.some((row) => row.kind === "video")
                    ? "Video received — transcription lands here once processed."
                    : "No video attached — the team works from the note and photos."}
                </dd>
              ) : null}
            </dl>
            <DetailBlock detail={detail} />
          </section>
        );
      })}

      {media.length > 0 ? (
        <section aria-label="Visit captures" className="mt-8 border-t border-border pt-6">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Photos and videos ({media.length})
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
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

      <section
        aria-label="Full board and reports"
        className="mt-8 rounded-2xl border border-border bg-card p-4"
      >
        <h2 className="font-display text-base font-bold tracking-tight">
          Full board &amp; reports
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your email and we&apos;ll send a private link to the tracker
          board and complete visit reports for this property. No account
          needed.
        </p>
        <div className="mt-3">
          <BoardLinkRequest jobId={anchor.id} />
        </div>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        The trade team reviews every check-in in turn. Urgent issues go first —
        for emergencies, call the number on your tenancy agreement.
      </p>
    </main>
  );
}

function DetailBlock({
  detail,
}: {
  detail: { key: string; body: string | null }[];
}) {
  if (detail.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Full detail is still building — check back shortly.
      </p>
    );
  }
  return (
    <details className="mt-3 rounded-xl border border-border bg-card px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold">
        Full detail
      </summary>
      <div className="mt-2 space-y-3">
        <DetailItems detail={detail} />
      </div>
    </details>
  );
}

function DetailItems({
  detail,
}: {
  detail: { key: string; body: string | null }[];
}) {
  return detail.map((entry) => (
    <div key={entry.key}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {sectionLabel(entry.key)}
      </h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
        {entry.body || "—"}
      </p>
    </div>
  ));
}
