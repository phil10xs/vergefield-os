import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Notice, PageHeader } from "@/components/layout/page-header";
import {
  JobPaymentBadge,
  JobSeverityBadge,
  JobStatusBadge,
} from "@/components/ui/status-badge";
import { ReportCelebration } from "@/components/request/report-celebration";
import { ViewBoardButton } from "@/components/request/view-board-button";
import { REPORT_SECTIONS } from "@/lib/checklist-template";
import {
  condenseTranscript,
  excerptWords,
  formatBudget,
  formatVisitDay,
  inferIssue,
  nameIssue,
  selectVisitSessions,
  sessionAddress,
  sumCostBands,
  visitDayOf,
} from "@/lib/sessions";
import {
  generateReport,
  getLatestReport,
  getPublicJob,
} from "@/server/reporting";
import { fitBoxToContain, type SamRegion } from "@/server/sam";
import { db } from "@/db";
import { job, siteMedia, type Job } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export const metadata: Metadata = { title: "Visit report" };

function sectionLabel(key: string): string {
  return REPORT_SECTIONS.find((section) => section.key === key)?.label ?? key;
}

function regionBoxes(raw: string | null): SamRegion[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is SamRegion =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as SamRegion).label === "string" &&
          ["x", "y", "w", "h", "fw", "fh"].every(
            (key) =>
              typeof (entry as Record<string, unknown>)[key] === "number" &&
              Number.isFinite((entry as Record<string, unknown>)[key]),
          ) &&
          (entry as SamRegion).w > 0 &&
          (entry as SamRegion).h > 0,
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}

function visitStatus(sessions: Job[]): string {
  if (sessions.length > 0 && sessions.every((row) => row.status === "paid"))
    return "paid";
  const order = ["in_progress", "completed", "requested"];
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
        await generateReport(session.id, session.requesterName ?? "VergeCare", {
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

  const budget = sumCostBands(sessions.map((entry) => entry.costBand));

  return (
    <AppShell>
      <ReportCelebration active={fresh === "1"} />
      {fresh === "1" ? (
        <Notice title={`Analysis complete — Issues snag list ready · ${reference}`}>
          Your clips are analysed and every issue is listed below. Bookmark
          this page — it is your private receipt.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow={`Visit report · ${reference}`}
        title={address}
        description={
          anchor.businessName
            ? `Checked in by ${anchor.requesterName ?? "you"} · ${anchor.businessName}`
            : undefined
        }
        meta={`${formatVisitDay(day)} · ${sessions.length} ${
          sessions.length === 1 ? "issue" : "issues"
        }${budget ? ` · budget ${formatBudget(budget)}` : ""}`}
      />
      <div className="mb-6">
        <JobStatusBadge status={visitStatus(sessions)} />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="mb-6 min-w-0 lg:sticky lg:top-20 lg:mb-0 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-4">
              <h2 className="font-display text-base font-bold tracking-tight">
                Issues snag list · {views.length}{" "}
                {views.length === 1 ? "issue" : "issues"}
              </h2>
              <div className="mt-3">
                <ViewBoardButton
                  jobId={anchor.id}
                  onboarding={{
                    name: anchor.requesterName ?? "",
                    businessName: anchor.businessName ?? "",
                    contact: anchor.requesterContact ?? "",
                  }}
                />
              </div>
            </div>
            <ul className="space-y-3 px-4 py-4">
              {views.map((view, index) => {
                const done =
                  view.session.status === "completed" ||
                  view.session.status === "paid";
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
                      <span className="block font-semibold leading-snug break-words">
                        {index + 1}. {view.session.title}
                      </span>
                      <span className="mt-0.5 block leading-snug text-muted-foreground break-words">
                        {view.summary}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {view.session.tradesmanTrade ?? "Trade detecting…"} ·{" "}
                        {view.session.status.replace(/_/g, " ")}
                        {view.session.costBand
                          ? ` · likely ${view.session.costBand}`
                          : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

      <div className="min-w-0 space-y-3">
        {views.map((view, index) => (
          <details
            key={view.session.id}
            open={index === 0}
            className="group overflow-hidden rounded-2xl border border-border bg-card"
          >
            <summary
              aria-label={`Issue ${index + 1}: ${view.session.title}`}
              className="flex cursor-pointer list-none items-start gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
            >
              <ChevronDown
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-muted-foreground">
                  Issue {index + 1} of {views.length}
                </span>
                <span className="mt-0.5 block font-display text-base font-bold tracking-tight break-words">
                  {view.session.title}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <JobStatusBadge status={view.session.status} />
                  <JobPaymentBadge
                    status={view.session.paymentStatus}
                    amountPence={view.session.paymentAmount}
                  />
                </span>
              </span>
            </summary>
            <div className="border-t border-border px-4 py-4">
              <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="font-semibold text-muted-foreground">Trade</dt>
                <dd className="min-w-0 break-words">
                  {view.session.tradesmanTrade ?? "Detecting…"}
                </dd>
                <dt className="font-semibold text-muted-foreground">Issue</dt>
                <dd className="min-w-0 font-semibold leading-relaxed break-words">
                  {view.name}
                </dd>
                {view.session.severity ? (
                  <>
                    <dt className="font-semibold text-muted-foreground">
                      Severity
                    </dt>
                    <dd>
                      <JobSeverityBadge severity={view.session.severity} />
                    </dd>
                  </>
                ) : null}
                {view.session.costBand ? (
                  <>
                    <dt className="font-semibold text-muted-foreground">
                      Likely cost
                    </dt>
                    <dd className="break-words">{view.session.costBand}</dd>
                  </>
                ) : null}
                {view.heard.length > 0 ? (
                  <>
                    <dt className="font-semibold text-muted-foreground">Heard</dt>
                    <dd className="min-w-0 whitespace-pre-line leading-relaxed break-words">
                      {condenseTranscript(view.heard.join(" "))}
                    </dd>
                  </>
                ) : null}
                {view.seen.length > 0 ? (
                  <>
                    <dt className="font-semibold text-muted-foreground">Seen</dt>
                    <dd className="min-w-0 whitespace-pre-line leading-relaxed break-words text-muted-foreground">
                      {condenseTranscript(view.seen.join(" "))}
                    </dd>
                  </>
                ) : null}
                {view.heard.length === 0 && view.seen.length === 0 ? (
                  <dd className="col-span-2 text-muted-foreground">
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
                        <span className="relative block aspect-video w-full bg-black">
                          <video
                            src={`/api/media/${row.id}`}
                            controls
                            preload="metadata"
                            className="h-full w-full"
                          />
                          {regionBoxes(row.regions).map((box, index) => {
                            const rect = fitBoxToContain(box);
                            return (
                              <span
                                key={index}
                                aria-hidden
                                className="pointer-events-none absolute rounded-md border-2 border-[#d4f34a]"
                                style={{
                                  left: `${rect.left * 100}%`,
                                  top: `${rect.top * 100}%`,
                                  width: `${rect.width * 100}%`,
                                  height: `${rect.height * 100}%`,
                                }}
                              >
                                <span className="absolute -top-6 left-0 max-w-full truncate rounded bg-[#d4f34a] px-1.5 py-0.5 text-[10px] font-bold text-[#071617]">
                                  {box.label.slice(0, 48)}
                                </span>
                              </span>
                            );
                          })}
                        </span>
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
                      <h3 className="text-sm font-semibold text-muted-foreground">
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
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        The trade team reviews every check-in in turn. Urgent issues go first —
        for emergencies, call the number on your tenancy agreement.
      </p>
    </AppShell>
  );
}
