"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import {
  applyInference,
  createPublicRequest,
  generateReport,
  saveVideoAnalysis,
} from "@/server/reporting";
import { groupFilesBySession } from "@/lib/media-rules";
import { TRADE_OPTIONS } from "@/lib/chat-parse";
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
        await saveVideoAnalysis(
          row.id,
          analysis.transcript,
          analysis.description,
          analysis.trade,
        );
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
  const pickedTrade = formText(formData, "trade");
  const hintedTrade =
    pickedTrade &&
    (TRADE_OPTIONS as readonly string[]).includes(pickedTrade) &&
    pickedTrade !== "Other"
      ? pickedTrade
      : null;
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
  await applyInference(created.id, hintedTrade);
  await generateReport(created.id, requesterName, { markSubmitted: false });
  for (const group of groups.slice(1)) {
    const sibling = await createPublicRequest({ ...base, description: "" });
    await saveMediaFiles(sibling.id, group, null);
    await applyInference(sibling.id, hintedTrade);
    await generateReport(sibling.id, requesterName, { markSubmitted: false });
  }
  revalidatePath("/track");
  revalidatePath("/board");
  redirect(`/request/${created.id}?new=1`);
}
