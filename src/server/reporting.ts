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
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CHECKLIST_TEMPLATE,
  REPORT_SECTIONS,
  type ReportSectionKey,
} from "@/lib/checklist-template";
import { buildTitle, inferTrade } from "@/lib/media-inference";
import { sectionText } from "@/lib/report-sections";

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

export interface ChecklistSave {
  id: string;
  checked: boolean;
  note: string | null;
}

export async function saveChecklist(
  jobId: string,
  items: ChecklistSave[],
  notes: Record<ReportSectionKey, string>,
): Promise<void> {
  for (const item of items) {
    await db
      .update(checklistItem)
      .set({ checked: item.checked, note: item.note || null })
      .where(
        and(eq(checklistItem.id, item.id), eq(checklistItem.jobId, jobId)),
      );
  }
  const row = {
    jobId,
    siteCondition: notes.site_condition || null,
    hazards: notes.hazards || null,
    materials: notes.materials || null,
    nextSteps: notes.next_steps || null,
  };
  await db
    .insert(jobNotes)
    .values(row)
    .onConflictDoUpdate({
      target: jobNotes.jobId,
      set: {
        siteCondition: row.siteCondition,
        hazards: row.hazards,
        materials: row.materials,
        nextSteps: row.nextSteps,
      },
    });
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
    media
      .map((row) => row.narration?.trim() || row.transcript?.trim())
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .slice(0, 500) || null;

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
      .set({ status: "submitted", updatedAt: new Date() })
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
      propertyAddress: input.propertyAddress,
      notes: input.description,
    })
    .returning();
  if (!row) throw new Error("Request insert failed");
  await ensureChecklist(row.id);
  return row;
}

export async function saveTranscript(
  mediaId: string,
  transcript: string,
  description: string,
): Promise<void> {
  await db
    .update(siteMedia)
    .set({
      transcript: transcript || null,
      visualDescription: description || null,
    })
    .where(eq(siteMedia.id, mediaId));
}

export async function applyInference(jobId: string): Promise<void> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  if (!row || row.source !== "public") return;
  const media = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.jobId, jobId))
    .orderBy(asc(siteMedia.createdAt));
  const transcript = media
    .map((entry) => entry.transcript?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const text = [transcript, row.notes?.trim()]
    .filter(Boolean)
    .join("\n");
  const trade = inferTrade(text) ?? "General";
  await db
    .update(job)
    .set({
      title: buildTitle(trade, row.propertyAddress ?? row.siteName ?? "", text),
      tradesmanTrade: trade,
      updatedAt: new Date(),
    })
    .where(eq(job.id, jobId));
}

export async function triageJob(
  jobId: string,
  decision: "accept" | "decline",
): Promise<void> {
  const [row] = await db.select().from(job).where(eq(job.id, jobId));
  if (!row) throw new Error("Job not found");
  if (row.status !== "requested") {
    throw new Error("Only new requests can be triaged");
  }
  await db
    .update(job)
    .set({
      status: decision === "accept" ? "planned" : "cancelled",
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
  "planned",
  "in_progress",
  "submitted",
  "resolved",
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

export { REPORT_SECTIONS };
export type { ReportSectionKey };
