import { db } from "@/db";
import {
  checklistItem,
  job,
  jobNotes,
  siteMedia,
  siteReport,
  type Job,
  type SiteReport,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import {
  CHECKLIST_TEMPLATE,
  REPORT_SECTIONS,
  type ReportSectionKey,
} from "@/lib/checklist-template";
import { buildTitle, inferTrade } from "@/lib/media-inference";
import { sectionText } from "@/lib/report-sections";
import { condenseTranscript } from "@/lib/sessions";

export async function ensureChecklist(jobId: string): Promise<void> {
  const existing = await db
    .select({ id: checklistItem.id })
    .from(checklistItem)
    .where(eq(checklistItem.jobId, jobId))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(checklistItem).values(
    CHECKLIST_TEMPLATE.map((template, index) => ({
      jobId,
      section: template.section,
      label: template.label,
      sort: index,
    })),
  );
}

export async function generateReport(
  jobId: string,
  author: string,
  options: { markSubmitted?: boolean } = {},
): Promise<SiteReport> {
  const [jobRow] = await db.select().from(job).where(eq(job.id, jobId));
  if (!jobRow) throw new Error("Job not found");
  const items = await db
    .select()
    .from(checklistItem)
    .where(eq(checklistItem.jobId, jobId))
    .orderBy(asc(checklistItem.sort));
  const [notes] = await db
    .select()
    .from(jobNotes)
    .where(eq(jobNotes.jobId, jobId));
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, jobId))
    .orderBy(asc(siteMedia.createdAt));
  const narration =
    condenseTranscript(
      media
        .map((row) => row.narration?.trim() || row.transcript?.trim())
        .filter((value): value is string => Boolean(value))
        .join(" "),
    ) || null;

  const bySection = (section: ReportSectionKey) =>
    items.filter((item) => item.section === section);
  const done = items.filter((item) => item.checked).length;
  const [report] = await db
    .insert(siteReport)
    .values({
      jobId,
      author,
      notes: `${jobRow.title} — ${done}/${items.length} checks complete across ${media.length} capture${media.length === 1 ? "" : "s"}.`,
      siteCondition: sectionText(
        "site_condition",
        notes?.siteCondition ?? null,
        bySection("site_condition"),
        narration,
      ),
      hazards: sectionText("hazards", notes?.hazards ?? null, bySection("hazards"), null),
      materials: sectionText(
        "materials",
        notes?.materials ?? null,
        bySection("materials"),
        null,
      ),
      nextSteps: sectionText(
        "next_steps",
        notes?.nextSteps ?? null,
        bySection("next_steps"),
        null,
      ),
      mediaUrls: media.map((row) => `/api/media/${row.id}`),
    })
    .returning();
  if (!report) throw new Error("Report insert failed");
  if (options.markSubmitted !== false) {
    await db
      .update(job)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(job.id, jobId));
  }
  return report;
}

export async function getLatestReport(
  jobId: string,
): Promise<SiteReport | undefined> {
  const [report] = await db
    .select()
    .from(siteReport)
    .where(eq(siteReport.jobId, jobId))
    .orderBy(desc(siteReport.createdAt))
    .limit(1);
  return report;
}

export interface PublicRequestInput {
  requesterName: string;
  requesterContact: string;
  businessName?: string | null;
  propertyAddress: string;
  priority: "low" | "medium" | "high";
  description: string;
}

export async function createPublicRequest(
  input: PublicRequestInput,
): Promise<Job> {
  const shortAddress =
    input.propertyAddress.split(",")[0]?.trim() || input.propertyAddress;
  const [row] = await db
    .insert(job)
    .values({
      title: `New request — ${shortAddress}`.slice(0, 120),
      siteName: input.propertyAddress,
      status: "requested",
      priority: input.priority,
      tradesmanTrade: null,
      source: "public",
      requesterName: input.requesterName,
      requesterContact: input.requesterContact,
      businessName: input.businessName ?? null,
      propertyAddress: input.propertyAddress,
      notes: input.description,
    })
    .returning();
  if (!row) throw new Error("Request insert failed");
  await ensureChecklist(row.id);
  return row;
}

export async function saveVideoAnalysis(
  mediaId: string,
  transcript: string,
  description: string,
  trade: string | null,
): Promise<void> {
  await db
    .update(siteMedia)
    .set({
      transcript: transcript || null,
      visualDescription: description || null,
      detectedTrade: trade,
    })
    .where(eq(siteMedia.id, mediaId));
}

export async function applyInference(
  jobId: string,
  hintedTrade?: string | null,
): Promise<void> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  if (!row || row.source !== "public") return;
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, jobId))
    .orderBy(asc(siteMedia.createdAt));
  const seen = media
    .map(
      (entry) =>
        [entry.transcript?.trim(), entry.visualDescription?.trim()]
          .filter(Boolean)
          .join(" "),
    )
    .filter(Boolean)
    .join(" ");
  const text = [seen, row.notes?.trim()].filter(Boolean).join("\n");
  const metaTrade = media
    .map((entry) => entry.detectedTrade?.trim())
    .find((value): value is string => Boolean(value));
  const trade =
    hintedTrade && hintedTrade !== "Other"
      ? hintedTrade
      : (metaTrade ?? inferTrade(text) ?? "General");
  await db
    .update(job)
    .set({
      title: buildTitle(trade, row.propertyAddress ?? row.siteName ?? "", text),
      tradesmanTrade: trade,
      updatedAt: new Date(),
    })
    .where(eq(job.id, jobId));
}

export async function getPublicJob(jobId: string): Promise<Job | undefined> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  return row;
}

const DEMO_STATUSES = [
  "requested",
  "in_progress",
  "completed",
  "paid",
  "cancelled",
] as const;

export async function setJobStatus(jobId: string, status: string): Promise<void> {
  if (!(DEMO_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid status");
  }
  await db
    .update(job)
    .set({ status, updatedAt: new Date() })
    .where(eq(job.id, jobId));
}

const BOARD_FLOW = ["requested", "in_progress", "completed", "paid"] as const;

export async function stepJobStatus(
  jobId: string,
  direction: "next" | "prev",
): Promise<void> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  if (!row) throw new Error("Job not found");
  const at = (BOARD_FLOW as readonly string[]).indexOf(row.status);
  if (at === -1) {
    await setJobStatus(jobId, "requested");
    return;
  }
  const next = at + (direction === "next" ? 1 : -1);
  if (next < 0 || next >= BOARD_FLOW.length) return;
  await setJobStatus(jobId, BOARD_FLOW[next]!);
}

export async function markPaid(jobId: string): Promise<void> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  if (!row) throw new Error("Job not found");
  if (row.status !== "completed") {
    throw new Error("Only completed issues can be paid");
  }
  await db
    .update(job)
    .set({ status: "paid", paymentStatus: "sent", updatedAt: new Date() })
    .where(eq(job.id, jobId));
}

export async function recordPayment(
  jobId: string,
  amountPence: number,
): Promise<void> {
  if (!Number.isInteger(amountPence) || amountPence <= 0 || amountPence > 10000000) {
    throw new Error("Enter a valid amount");
  }
  await db
    .update(job)
    .set({
      paymentAmount: amountPence,
      paymentStatus: "sent",
      updatedAt: new Date(),
    })
    .where(eq(job.id, jobId));
}

export async function markPaymentDue(
  jobId: string,
  amountPence: number | null,
): Promise<void> {
  if (
    amountPence !== null &&
    (!Number.isInteger(amountPence) ||
      amountPence <= 0 ||
      amountPence > 10000000)
  ) {
    throw new Error("Enter a valid amount");
  }
  await db
    .update(job)
    .set({
      ...(amountPence !== null ? { paymentAmount: amountPence } : {}),
      paymentStatus: "due",
      updatedAt: new Date(),
    })
    .where(eq(job.id, jobId));
}

export { REPORT_SECTIONS };
export type { ReportSectionKey };
