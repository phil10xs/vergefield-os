"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import {
  applyInference,
  createPublicRequest,
  generateReport,
  markPaymentDue,
  recordPayment,
  saveTranscript,
  setJobStatus,
} from "@/server/reporting";
import { requestBoardLink } from "@/server/board-access";
import { groupFilesBySession } from "@/lib/media-rules";
import { analyzeVideo } from "@/server/analyze-video";
import { saveUpload } from "@/server/media-store";

function formText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function saveMediaFiles(
  jobId: string,
  files: File[],
  narration: string | null,
): Promise<void> {
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
}

function mediaFiles(formData: FormData): File[] {
  return formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createPublicRequestAction(
  formData: FormData,
): Promise<void> {
  const requesterName = formText(formData, "requesterName");
  const requesterContact = formText(formData, "requesterContact");
  const propertyAddress = formText(formData, "propertyAddress");
  const businessName = formText(formData, "businessName");
  const note = formText(formData, "note");
  if (!requesterName || !requesterContact || !propertyAddress) {
    throw new Error("Name, contact, and address are all required");
  }
  const files = mediaFiles(formData);
  if (!note && files.length === 0) {
    throw new Error("Describe the issue or attach a video");
  }
  if (files.some((file) => !file.type.startsWith("video/"))) {
    throw new Error("Only videos are allowed — attach short video clips.");
  }
  const priority: "low" | "medium" | "high" =
    formText(formData, "urgency") === "urgent" ? "high" : "medium";
  const groups = groupFilesBySession(files);
  const base = {
    requesterName,
    requesterContact,
    businessName,
    propertyAddress,
    priority,
  };
  const created = await createPublicRequest({
    ...base,
    description: note ?? "See photos and video.",
  });
  await saveMediaFiles(created.id, groups[0] ?? [], null);
  await applyInference(created.id);
  await generateReport(created.id, requesterName, { markSubmitted: false });
  for (const group of groups.slice(1)) {
    const sibling = await createPublicRequest({ ...base, description: "" });
    await saveMediaFiles(sibling.id, group, null);
    await applyInference(sibling.id);
    await generateReport(sibling.id, requesterName, { markSubmitted: false });
  }
  revalidatePath("/track");
  redirect(`/request/${created.id}?new=1`);
}

export async function setJobStatusAction(
  formData: FormData,
): Promise<void> {
  const jobId = formText(formData, "jobId");
  const status = formText(formData, "status");
  if (!jobId || !status) throw new Error("Job and status are required");
  await setJobStatus(jobId, status);
  revalidatePath("/track");
}

export async function requestBoardLinkAction(
  jobId: string,
  email: string,
): Promise<{ url: string; emailed: boolean }> {
  return requestBoardLink(jobId, email);
}

export async function savePaymentDecisionAction(
  formData: FormData,
): Promise<void> {
  const jobId = formText(formData, "jobId");
  const decision = formText(formData, "decision");
  if (!jobId || (decision !== "due" && decision !== "sent")) {
    throw new Error("Job and decision are required");
  }
  const raw = formText(formData, "amount");
  if (decision === "sent") {
    if (!raw) throw new Error("Job and amount are required");
    const pounds = Number(raw);
    if (!Number.isFinite(pounds) || pounds <= 0) {
      throw new Error("Enter a valid amount");
    }
    await recordPayment(jobId, Math.round(pounds * 100));
  } else {
    await markPaymentDue(jobId, raw ? Math.round(Number(raw) * 100) : null);
  }
  revalidatePath("/track");
}
