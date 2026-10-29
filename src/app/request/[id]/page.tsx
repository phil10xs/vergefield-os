import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, CheckCircle2, ChevronDown } from "lucide-react";
import {
  JobPaymentBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { BoardLinkRequest } from "@/components/request/board-link-request";
import { REPORT_SECTIONS } from "@/lib/checklist-template";
import {
  condenseTranscript,
  excerptWords,
  formatVisitDay,
  inferIssue,
  nameIssue,
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
        await generateReport(session.id, session.requesterName ?? "VergeSnag", {
          markSubmitted: false,
        }),
      );
    }
  }

  const views = sessions.map((session) => {
    const clips = mediaBySession.get(session.id) ?? [];
    const heard = clips
      .map((row) => row.transcript?.trim())
      .filter((value): value is string => Boolean(value));
    const seen = clips
      .map((row) => row.visualDescription?.trim())
      .filter((value): value is string => Boolean(value));
    const report = reports.get(session.id);
    const issue = inferIssue(session.notes, heard, seen);
    return {
      session,
      clips,
      heard,
      seen,
      issue,
      name: nameIssue(
        [...heard, ...seen, session.notes ?? ""].join(" "),
        session.tradesmanTrade,
      ),
      summary: excerptWords(issue, 10),
      detail: report
        ? [
            { key: "site_condition", body: report.siteCondition },
            { key: "next_steps", body: report.nextSteps },
          ]
        : [],
    };
  });

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
          {sessions.length === 1 ? "issue" : "issues"}
        </span>
      </div>
      {anchor.businessName ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Checked in by {anchor.requesterName ?? "you"} · {anchor.businessName}
        </p>
      ) : null}

      <details
        open
        className="group mt-6 overflow-hidden rounded-2xl border border-border bg-card"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
          <span className="font-display text-base font-bold tracking-tight">
            Snag list · {views.length}{" "}
            {views.length === 1 ? "issue" : "issues"}
          </span>
        </summary>
        <ul className="space-y-2.5 border-t border-border px-4 py-4">
          {views.map((view, index) => {
            const done = view.session.status === "resolved";
            return (
              <li key={view.session.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    done
                      ? "border-[var(--gv-teal-bright)] bg-[var(--gv-teal-bright)] text-black"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : null}
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold leading-snug">
                    {index + 1}. {view.session.title}
                  </span>
                  <span className="mt-0.5 block leading-snug text-muted-foreground">
                    {view.summary}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {view.session.tradesmanTrade ?? "Trade detecting…"} ·{" "}
                    {view.session.status.replace(/_/g, " ")}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="mt-6 space-y-3">
        {views.map((view, index) => (
          <details
            key={view.session.id}
            open={index === 0}
            className="group overflow-hidden rounded-2xl border border-border bg-card"
          >
            <summary
              aria-label={`Issue ${index + 1}: ${view.session.title}`}
              className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden"
            >
              <ChevronDown
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Issue {index + 1} of {views.length}
                </span>
                <span className="block truncate font-display text-base font-bold tracking-tight">
                  {view.session.title}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <JobStatusBadge status={view.session.status} />
                <JobPaymentBadge
                  status={view.session.paymentStatus}
                  amountPence={view.session.paymentAmount}
                />
              </span>
            </summary>
            <div className="border-t border-border px-4 py-4">
              <dl className="grid gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">Trade:</dt>
                  <dd>{view.session.tradesmanTrade ?? "Detecting…"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">Issue:</dt>
                  <dd className="font-semibold leading-relaxed">
                    {view.name}
                  </dd>
                </div>
                {view.heard.length > 0 ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold">Heard:</dt>
                    <dd className="whitespace-pre-line leading-relaxed">
                      {condenseTranscript(view.heard.join(" "))}
                    </dd>
                  </div>
                ) : null}
                {view.seen.length > 0 ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold">Seen:</dt>
                    <dd className="whitespace-pre-line leading-relaxed text-muted-foreground">
                      {condenseTranscript(view.seen.join(" "))}
                    </dd>
                  </div>
                ) : null}
                {view.heard.length === 0 && view.seen.length === 0 ? (
                  <dd className="text-muted-foreground">
                    {view.clips.some((row) => row.kind === "video")
                      ? "Video received — transcription lands here once processed."
                      : "No video attached — the team works from your note."}
                  </dd>
                ) : null}
              </dl>
              {view.clips.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {view.clips.map((row) => (
                    <figure
                      key={row.id}
                      className="overflow-hidden rounded-xl border border-border bg-background"
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
              ) : null}
              {view.detail.length > 0 ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {view.detail.map((entry) => (
                    <div key={entry.key}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {sectionLabel(entry.key)}
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                        {entry.body || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Full detail is still building — check back shortly.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>

      <section
        aria-label="Tracker board link"
        className="mt-6 rounded-2xl border border-border bg-card p-4"
      >
        <h2 className="font-display text-base font-bold tracking-tight">
          Your tracker board
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get the private tracker-board link for this property. No account
          needed.
        </p>
        <div className="mt-3">
          <BoardLinkRequest
            jobId={anchor.id}
            knownEmail={anchor.requesterContact}
          />
        </div>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        The trade team reviews every check-in in turn. Urgent issues go first —
        for emergencies, call the number on your tenancy agreement.
      </p>
    </main>
  );
}
