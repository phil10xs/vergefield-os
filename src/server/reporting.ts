import { db } from "@/db";
import {
  checklistItem,
  job,
  jobNotes,
  siteMedia,
  siteReport,
  type ChecklistItem,
  type Job,
  type SiteReport,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CHECKLIST_TEMPLATE,
  REPORT_SECTIONS,
  type ReportSectionKey,
} from "@/lib/checklist-template";

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

function sectionText(
  section: ReportSectionKey,
  note: string | null,
  items: ChecklistItem[],
  spoken: string | null,
): string {
  const lines: string[] = [];
  if (note) lines.push(note);
  const done = items.filter((item) => item.checked).length;
  lines.push(`Checklist: ${done}/${items.length} complete.`);
  for (const item of items.filter((item) => !item.checked)) {
    lines.push(
      `Follow up: ${item.label}${item.note ? ` — ${item.note}` : ""}`,
    );
  }
  for (const item of items.filter((item) => item.checked && item.note)) {
    lines.push(`${item.label} — ${item.note}`);
  }
  if (section === "site_condition" && spoken) {
    lines.push(`Spoken site notes: ${spoken}`);
  }
  return lines.join("\n");
}

export async function generateReport(
  jobId: string,
  author: string,
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
  const spoken =
    media
      .map((row) => row.narration?.trim())
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
        spoken,
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
  await db
    .update(job)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(job.id, jobId));
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
  requesterRole: string;
  requesterContact: string;
  propertyAddress: string;
  trade: string;
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
      title: `${input.trade} request — ${shortAddress}`.slice(0, 120),
      siteName: input.propertyAddress,
      status: "requested",
      priority: input.priority,
      tradesmanTrade: input.trade,
      source: "public",
      requesterName: input.requesterName,
      requesterRole: input.requesterRole,
      requesterContact: input.requesterContact,
      propertyAddress: input.propertyAddress,
      notes: input.description,
    })
    .returning();
  if (!row) throw new Error("Request insert failed");
  await ensureChecklist(row.id);
  return row;
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

export { REPORT_SECTIONS };
export type { ReportSectionKey };
