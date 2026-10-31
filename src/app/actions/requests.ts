"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { job, siteMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  applyInference,
  createPublicRequest,
  generateReport,
  markPaid,
  markPaymentDue,
  recordPayment,
  saveVideoAnalysis,
  setJobStatus,
  setPaymentAmount,
} from "@/server/reporting";
import {
  beginPropertyBoard,
  getLandlordAccess,
} from "@/server/board-access";
import { addressFromKey, safeAppPath, withSearchParam } from "@/lib/app-url";
import { adjacentBoardStatus } from "@/lib/board-flow";
import { parsePoundsToPence } from "@/lib/payments";
import { sessionAddress } from "@/lib/sessions";
import { groupFilesBySession } from "@/lib/media-rules";
import { TRADE_OPTIONS } from "@/lib/chat-parse";
import { analyzeVideo, assessIssue } from "@/server/analyze-video";
import { conceptFromAnalysis, localizeIssue } from "@/server/sam";
import { saveUpload } from "@/server/media-store";

function formText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function saveMediaFiles(
  jobId: string,
  files: File[],
  narration: string | null,
  frameByVideo: Map<File, File | undefined>,
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
        const frame = frameByVideo.get(file);
        if (
          frame &&
          frame.type.startsWith("image/") &&
          frame.size > 0 &&
          frame.size <= 2 * 1024 * 1024
        ) {
          const concept = conceptFromAnalysis(analysis);
          if (concept) {
            const regions = await localizeIssue(
              Buffer.from(await frame.arrayBuffer()),
              concept,
            );
            if (regions) {
              await db
                .update(siteMedia)
                .set({ regions: JSON.stringify(regions) })
                .where(eq(siteMedia.id, row.id));
            }
          }
        }
        const assessment = await assessIssue(
          analysis.transcript,
          analysis.description,
        );
        if (assessment) {
          await db
            .update(job)
            .set({
              severity: assessment.severity,
              costBand: assessment.costBand,
              updatedAt: new Date(),
            })
            .where(eq(job.id, jobId));
        }
      }
    }
  }
}

function mediaFiles(formData: FormData): File[] {
  return formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

/** Silent stills captured alongside videos for SAM grounding, by video order. */
function frameFiles(formData: FormData): File[] {
  return formData
    .getAll("frames")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createPublicRequestAction(
  formData: FormData,
): Promise<void> {
  const propertyAddress = formText(formData, "propertyAddress");
  const note = formText(formData, "note");
  if (!propertyAddress) {
    throw new Error("Address is required");
  }
  const files = mediaFiles(formData);
  if (!note && files.length === 0) {
    throw new Error("Describe the issue or attach a video");
  }
  if (files.some((file) => !file.type.startsWith("video/"))) {
    throw new Error("Only videos are allowed — attach short video clips.");
  }
  const priority: "low" | "medium" | "high" = "medium";
  const pickedTrade = formText(formData, "trade");
  const hintedTrade =
    pickedTrade &&
    (TRADE_OPTIONS as readonly string[]).includes(pickedTrade) &&
    pickedTrade !== "Other"
      ? pickedTrade
      : null;
  const videos = files.filter((file) => file.type.startsWith("video/"));
  const frameByIndex = new Map<number, File>();
  for (const frame of frameFiles(formData)) {
    const match = /^sam-frame-(\d+)\.jpg$/.exec(frame.name);
    if (match?.[1] !== undefined) frameByIndex.set(Number(match[1]), frame);
  }
  const frameByVideo = new Map<File, File | undefined>(
    videos.map((file, index) => [file, frameByIndex.get(index)]),
  );
  const groups = groupFilesBySession(files);
  const base = {
    requesterName: null,
    requesterContact: null,
    businessName: null,
    propertyAddress,
    priority,
  };
  const created = await createPublicRequest({
    ...base,
    description: note ?? "See photos and video.",
  });
  await saveMediaFiles(created.id, groups[0] ?? [], null, frameByVideo);
  await applyInference(created.id, hintedTrade);
  await generateReport(created.id, "VergeCare", { markSubmitted: false });
  for (const group of groups.slice(1)) {
    const sibling = await createPublicRequest({ ...base, description: "" });
    await saveMediaFiles(sibling.id, group, null, frameByVideo);
    await applyInference(sibling.id, hintedTrade);
    await generateReport(sibling.id, "VergeCare", { markSubmitted: false });
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
  if (status === "completed") {
    const dest = safeAppPath(formText(formData, "returnTo")) ?? "/track?view=board";
    redirect(withSearchParam(dest, "celebrate", "1"));
  }
}

export async function openPropertyBoardAction(
  jobId: string,
  contact: string,
  details?: { name: string; businessName: string | null },
) {
  return beginPropertyBoard(jobId, contact, details);
}

export async function moveBoardIssueAction(formData: FormData): Promise<void> {
  const token = formText(formData, "token");
  const propertyKeyValue = formText(formData, "propertyKey");
  const jobId = formText(formData, "jobId");
  const direction = formText(formData, "direction");
  if (
    !token ||
    !propertyKeyValue ||
    !jobId ||
    (direction !== "next" && direction !== "prev")
  ) {
    throw new Error("Job and direction are required");
  }
  const address = addressFromKey(propertyKeyValue);
  if (!address) throw new Error("Property not found");
  const access = await getLandlordAccess(token);
  if (!access) throw new Error("This link has expired");
  const owned = access.jobs.find(
    (row) => row.id === jobId && sessionAddress(row) === address,
  );
  if (!owned) throw new Error("Issue not found");
  const status = adjacentBoardStatus(owned.status, direction);
  if (!status) return;
  await setJobStatus(jobId, status);
  const boardPath = `/b/${encodeURIComponent(token)}/p/${encodeURIComponent(propertyKeyValue)}/board`;
  revalidatePath(boardPath);
  revalidatePath(`/b/${encodeURIComponent(token)}/p/${encodeURIComponent(propertyKeyValue)}`);
  revalidatePath(`/b/${encodeURIComponent(token)}`);
  if (status === "paid") {
    redirect(withSearchParam(boardPath, "celebrate", "paid"));
  }
  if (status === "completed") {
    redirect(withSearchParam(boardPath, "celebrate", "1"));
  }
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
    await recordPayment(jobId, parsePoundsToPence(raw));
  } else {
    await markPaymentDue(jobId, raw ? parsePoundsToPence(raw) : null);
  }
  revalidatePath("/track");
}

export async function saveBoardIssueAmountAction(
  formData: FormData,
): Promise<void> {
  const token = formText(formData, "token");
  const propertyKeyValue = formText(formData, "propertyKey");
  const jobId = formText(formData, "jobId");
  if (!token || !propertyKeyValue || !jobId) {
    throw new Error("Job and amount are required");
  }
  const address = addressFromKey(propertyKeyValue);
  if (!address) throw new Error("Property not found");
  const access = await getLandlordAccess(token);
  if (!access) throw new Error("This link has expired");
  const owned = access.jobs.find(
    (row) => row.id === jobId && sessionAddress(row) === address,
  );
  if (!owned) throw new Error("Issue not found");
  await setPaymentAmount(jobId, parsePoundsToPence(formText(formData, "amount")));
  const boardPath = `/b/${encodeURIComponent(token)}/p/${encodeURIComponent(propertyKeyValue)}/board`;
  revalidatePath(boardPath);
  revalidatePath(`/b/${encodeURIComponent(token)}/p/${encodeURIComponent(propertyKeyValue)}`);
  revalidatePath(`/b/${encodeURIComponent(token)}`);
}

export async function markPaidAction(formData: FormData): Promise<void> {
  const jobId = formText(formData, "jobId");
  if (!jobId) throw new Error("Job is required");
  await markPaid(jobId);
  revalidatePath("/track");
  redirect("/track?view=board&paid=1");
}
