import { randomBytes } from "crypto";
import { db } from "@/db";
import { boardToken, job, type Job } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  BOARD_TOKEN_TTL_MS,
  isBoardTokenLive,
  isValidEmail,
} from "@/lib/board-token";
import { sendBoardLinkEmail } from "./board-mail";

export async function requestBoardLink(
  jobId: string,
  email: string,
): Promise<{ url: string; emailed: boolean }> {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) throw new Error("Enter a valid email address");
  const [row] = await db.select({ id: job.id }).from(job).where(eq(job.id, jobId));
  if (!row) throw new Error("Job not found");
  const token = randomBytes(32).toString("hex");
  await db.insert(boardToken).values({
    token,
    jobId,
    email: clean,
    expiresAt: new Date(Date.now() + BOARD_TOKEN_TTL_MS),
  });
  const url = `/b/${token}`;
  const emailed = await sendBoardLinkEmail(clean, url);
  return { url, emailed };
}

export async function getBoardJob(token: string): Promise<Job | undefined> {
  const [link] = await db
    .select()
    .from(boardToken)
    .where(eq(boardToken.token, token));
  if (!link || !isBoardTokenLive(link.expiresAt)) return undefined;
  const [row] = await db.select().from(job).where(eq(job.id, link.jobId));
  return row;
}
