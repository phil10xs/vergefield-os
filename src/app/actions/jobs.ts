"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { job, siteMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseJobMessage, type JobDraft } from "@/lib/chat-parse";
import type { ReportSectionKey } from "@/lib/checklist-template";
import {
  applyInference,
  createPublicRequest,
  ensureChecklist,
  generateReport,
  saveChecklist,
  saveTranscript,
  triageJob,
} from "@/server/reporting";
import { analyzeVideo } from "@/server/analyze-video";
import { saveUpload } from "@/server/media-store";

export async function parseChatAction(message: string): Promise<JobDraft> {
  return parseJobMessage(message);
}

function formText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const PRIORITIES = ["low", "medium", "high"] as const;

export async function createJobFromDraft(formData: FormData): Promise<void> {
  const title = formText(formData, "title");
  if (!title) throw new Error("Job title is required");
  const rawPriority = formText(formData, "priority");
  const priority = PRIORITIES.includes(
    (rawPriority ?? "") as (typeof PRIORITIES)[number],
  )
    ? (rawPriority as (typeof PRIORITIES)[number])
    : "medium";
  const [row] = await db
    .insert(job)
    .values({
      title,
      siteName: formText(formData, "siteName"),
      assignee: formText(formData, "assignee"),
      priority,
      tradesmanTrade: formText(formData, "trade"),
      notes: formText(formData, "notes"),
    })
    .returning();
  if (!row) throw new Error("Job insert failed");
  await ensureChecklist(row.id);
  revalidatePath("/jobs");
  redirect(`/jobs/${row.id}/capture`);
}

export async function saveCaptureAction(formData: FormData): Promise<void> {
  const jobId = formText(formData, "jobId");
  if (!jobId) throw new Error("Job id is required");
  const [jobRow] = await db.select().from(job).where(eq(job.id, jobId));
  if (!jobRow) throw new Error("Job not found");

  const tradeSelect = formText(formData, "trade") ?? "Other";
  const tradesmanTrade =
    tradeSelect === "Other"
      ? (formText(formData, "otherTrade") ?? "Other")
      : tradeSelect;
  const narration = formText(formData, "narration");
  const files = formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) throw new Error("Attach at least one photo or video");

  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(jobId, file.name, file.type, bytes);
    const [row] = await db
      .insert(siteMedia)
      .values({
        jobId,
        kind: saved.kind,
        filename: saved.filename,
        mimeType: file.type,
        sizeBytes: saved.sizeBytes,
        narration,
      })
      .returning();
    if (row && saved.kind === "video") {
      const analysis = await analyzeVideo(bytes, file.type);
      if (analysis) {
        await saveTranscript(row.id, analysis.transcript, analysis.description);
      }
    }
  }
  await db
    .update(job)
    .set({
      tradesmanName: formText(formData, "tradesmanName"),
      tradesmanTrade,
      status: "in_progress",
      updatedAt: new Date(),
    })
    .where(eq(job.id, jobId));
  revalidatePath(`/jobs/${jobId}/capture`);
  redirect(`/jobs/${jobId}/checklist`);
}

const NOTE_KEYS: ReportSectionKey[] = [
  "site_condition",
  "hazards",
  "materials",
  "next_steps",
];

export async function saveChecklistAction(
  formData: FormData,
): Promise<void> {
  const jobId = formText(formData, "jobId");
  if (!jobId) throw new Error("Job id is required");
  const rawIds = formData.get("itemIds");
  const itemIds =
    typeof rawIds === "string" ? rawIds.split(",").filter(Boolean) : [];
  await saveChecklist(
    jobId,
    itemIds.map((id) => ({
      id,
      checked: formData.get(`check-${id}`) === "on",
      note: formText(formData, `note-${id}`),
    })),
    Object.fromEntries(
      NOTE_KEYS.map((key) => [key, formText(formData, key) ?? ""]),
    ) as Record<ReportSectionKey, string>,
  );
  if (formData.get("intent") === "generate") {
    const author = formText(formData, "author") ?? "Project Engineer";
    await generateReport(jobId, author);
    revalidatePath(`/jobs/${jobId}/report`);
    redirect(`/jobs/${jobId}/report`);
  }
  revalidatePath(`/jobs/${jobId}/checklist`);
}

export async function createPublicRequestAction(
  formData: FormData,
): Promise<void> {
  const requesterName = formText(formData, "requesterName");
  const requesterContact = formText(formData, "requesterContact");
  const propertyAddress = formText(formData, "propertyAddress");
  const note = formText(formData, "note");
  if (!requesterName || !requesterContact || !propertyAddress) {
    throw new Error("Name, contact, and address are all required");
  }
  const files = formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0 && !note) {
    throw new Error("Describe the issue or attach a photo or video");
  }
  if (files.filter((file) => file.type.startsWith("video/")).length > 1) {
    throw new Error("Please attach at most one video — add stills for the rest");
  }
  const created = await createPublicRequest({
    requesterName,
    requesterContact,
    propertyAddress,
    priority: formText(formData, "urgency") === "urgent" ? "high" : "medium",
    description: note ?? "",
  });
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(created.id, file.name, file.type, bytes);
    const [row] = await db
      .insert(siteMedia)
      .values({
        jobId: created.id,
        kind: saved.kind,
        filename: saved.filename,
        mimeType: file.type,
        sizeBytes: saved.sizeBytes,
        narration: null,
      })
      .returning();
    if (row && saved.kind === "video") {
      const analysis = await analyzeVideo(bytes, file.type);
      if (analysis) {
        await saveTranscript(row.id, analysis.transcript, analysis.description);
      }
    }
  }
  await applyInference(created.id);
  revalidatePath("/jobs");
  redirect(`/request/thanks?jobId=${created.id}`);
}

export async function triageRequestAction(
  formData: FormData,
): Promise<void> {
  const jobId = formText(formData, "jobId");
  const decision = formText(formData, "decision");
  if (!jobId || (decision !== "accept" && decision !== "decline")) {
    throw new Error("Invalid triage");
  }
  const title = formText(formData, "title");
  const trade = formText(formData, "trade");
  if (title || trade) {
    await db
      .update(job)
      .set({
        ...(title ? { title } : {}),
        ...(trade ? { tradesmanTrade: trade } : {}),
        updatedAt: new Date(),
      })
      .where(eq(job.id, jobId));
  }
  await triageJob(jobId, decision);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${jobId}`);
}
