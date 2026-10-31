import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { boardToken, job, type Job } from "@/db/schema";
import {
  addressFromKey,
  landlordPropertiesUrl,
  propertyBoardPath,
} from "@/lib/app-url";
import {
  BOARD_TOKEN_TTL_MS,
  classifyLandlordContact,
  isBoardTokenLive,
  isBoardTokenShape,
  jobsForLandlord,
  normalizeContact,
} from "@/lib/board-token";
import { sessionAddress, visitDayOf } from "@/lib/sessions";
import type { BoardEmailStatus, BoardOpenResult } from "@/lib/view-board";
import { sendBoardLinkEmail } from "@/server/board-mail";
import { startBoardEmail } from "@/server/board-open";
import { queueBoardLinkSend } from "@/server/email/schedule-send";
import {
  emailConfigured,
  isBlockedEmailRecipient,
} from "@/server/email/ses";

/**
 * Landlord magic link. The token is the credential. A password added later
 * must not be required here and must not invalidate tokens already sent.
 */
export async function ensureLandlordLink(
  jobId: string,
  email: string,
): Promise<{
  token: string;
  email: string;
  boardPath: string;
  propertiesUrl: string;
  recipientName: string | null;
  emailedAt: Date | null;
}> {
  const clean = normalizeContact(email);
  const classified = classifyLandlordContact(clean);
  if (!classified) {
    throw new Error(
      email.includes("@")
        ? "Enter a valid email address"
        : "Enter a phone number or email",
    );
  }
  const [anchor] = await db.select().from(job).where(eq(job.id, jobId));
  if (!anchor) throw new Error("Job not found");

  const [existing] = await db
    .select()
    .from(boardToken)
    .where(eq(boardToken.email, clean))
    .orderBy(desc(boardToken.createdAt))
    .limit(1);

  const expiresAt = new Date(Date.now() + BOARD_TOKEN_TTL_MS);
  let token: string;
  let emailedAt: Date | null = null;
  if (existing && isBoardTokenLive(existing.expiresAt)) {
    token = existing.token;
    emailedAt = existing.emailedAt;
    await db
      .update(boardToken)
      .set({ expiresAt })
      .where(eq(boardToken.token, token));
  } else {
    token = randomBytes(24).toString("base64url");
    await db.insert(boardToken).values({
      token,
      jobId,
      email: clean,
      expiresAt,
    });
  }

  return {
    token,
    email: clean,
    boardPath: propertyBoardPath(token, sessionAddress(anchor)),
    propertiesUrl: landlordPropertiesUrl(token),
    recipientName: anchor.requesterName,
    emailedAt,
  };
}

/** Latest live token for each email that already has a queued magic link. */
export async function landlordLinksEmailed(
  emails: string[],
): Promise<Set<string>> {
  const clean = [
    ...new Set(
      emails
        .map((value) => normalizeContact(value))
        .filter((value) => value.length > 0),
    ),
  ];
  if (clean.length === 0) return new Set();
  const rows = await db
    .select({
      email: boardToken.email,
      emailedAt: boardToken.emailedAt,
      expiresAt: boardToken.expiresAt,
    })
    .from(boardToken)
    .where(inArray(boardToken.email, clean))
    .orderBy(desc(boardToken.createdAt));
  const sent = new Set<string>();
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.email)) continue;
    seen.add(row.email);
    if (row.emailedAt && isBoardTokenLive(row.expiresAt)) sent.add(row.email);
  }
  return sent;
}

export async function landlordLinkEmailed(email: string): Promise<boolean> {
  const sent = await landlordLinksEmailed([email]);
  return sent.has(normalizeContact(email));
}

async function claimBoardLinkEmail(token: string): Promise<boolean> {
  const [row] = await db
    .update(boardToken)
    .set({ emailedAt: new Date() })
    .where(and(eq(boardToken.token, token), isNull(boardToken.emailedAt)))
    .returning({ token: boardToken.token });
  return Boolean(row);
}

async function releaseBoardLinkEmail(token: string): Promise<void> {
  await db
    .update(boardToken)
    .set({ emailedAt: null })
    .where(eq(boardToken.token, token));
}

async function sendQueuedBoardLink(
  email: string,
  propertiesUrl: string,
  recipientName?: string | null,
): Promise<void> {
  await sendBoardLinkEmail(email, propertiesUrl, recipientName);
}

/**
 * Queue the magic link the first time this live token has no send on record.
 * A failed queue releases the claim so a later View Board can send once.
 * An email failure here must not throw — the board still opens.
 */
async function deliverLandlordLink(link: {
  token: string;
  email: string;
  propertiesUrl: string;
  recipientName: string | null;
  emailedAt: Date | null;
}): Promise<{ emailStatus: BoardEmailStatus; message: string }> {
  const configured = emailConfigured();
  const blocked = isBlockedEmailRecipient(link.email);
  let alreadySent = link.emailedAt != null;
  let claimed = false;
  if (!alreadySent && configured && !blocked) {
    try {
      claimed = await claimBoardLinkEmail(link.token);
      if (!claimed) alreadySent = true;
    } catch (error) {
      console.error(
        "[board-link] could not record email",
        error instanceof Error ? error.name : "Error",
      );
    }
  }
  if (alreadySent) {
    console.info("[board-link] live link already emailed — skip");
  }
  const delivery = startBoardEmail({
    email: link.email,
    propertiesUrl: link.propertiesUrl,
    recipientName: link.recipientName,
    configured,
    blocked,
    alreadySent,
    queue: queueBoardLinkSend,
    send: sendQueuedBoardLink,
  });
  if (claimed && delivery.emailStatus !== "scheduled") {
    try {
      await releaseBoardLinkEmail(link.token);
    } catch (error) {
      console.error(
        "[board-link] could not clear email claim",
        error instanceof Error ? error.name : "Error",
      );
    }
  } else if (!claimed && !alreadySent && delivery.emailStatus === "scheduled") {
    try {
      await db
        .update(boardToken)
        .set({ emailedAt: new Date() })
        .where(eq(boardToken.token, link.token));
    } catch (error) {
      console.error(
        "[board-link] could not record email",
        error instanceof Error ? error.name : "Error",
      );
    }
  }
  return delivery;
}

async function saveCheckinContact(
  jobId: string,
  details: { name: string; businessName: string | null; contact: string },
): Promise<void> {
  const [anchor] = await db.select().from(job).where(eq(job.id, jobId));
  if (!anchor) throw new Error("Job not found");
  const address = sessionAddress(anchor);
  const day = visitDayOf(anchor.createdAt);
  const anchorContact = anchor.requesterContact?.trim() ?? "";
  const rows = await db.select().from(job);
  const ids = rows
    .filter((row) => {
      if (row.id === anchor.id) return true;
      if (row.source !== "public") return false;
      if (sessionAddress(row) !== address) return false;
      if (visitDayOf(row.createdAt) !== day) return false;
      const contact = row.requesterContact?.trim() ?? "";
      return contact.length === 0 || contact === anchorContact;
    })
    .map((row) => row.id);
  await db
    .update(job)
    .set({
      requesterName: details.name,
      requesterContact: details.contact,
      businessName: details.businessName,
      updatedAt: new Date(),
    })
    .where(inArray(job.id, ids));
  for (const id of ids) revalidatePath(`/request/${id}`);
}

export async function beginPropertyBoard(
  jobId: string,
  contact: string,
  details?: { name: string; businessName: string | null },
): Promise<BoardOpenResult> {
  const classified = classifyLandlordContact(contact);
  if (!classified) {
    throw new Error(
      contact.includes("@")
        ? "Enter a valid email address"
        : "Enter a phone number or email",
    );
  }
  if (details) {
    const name = details.name.trim();
    if (!name) throw new Error("Full name is required");
    await saveCheckinContact(jobId, {
      name,
      businessName: details.businessName?.trim() || null,
      contact: classified.value,
    });
  }
  const link = await ensureLandlordLink(jobId, classified.value);
  if (classified.kind === "phone") {
    return {
      boardPath: link.boardPath,
      propertiesUrl: link.propertiesUrl,
      email: "",
      emailStatus: "not_emailed",
      message: "No email was sent.",
    };
  }
  let delivery: { emailStatus: BoardEmailStatus; message: string };
  try {
    delivery = await deliverLandlordLink(link);
  } catch (error) {
    console.error(
      "[board-link] email step failed",
      error instanceof Error ? error.name : "Error",
    );
    delivery = {
      emailStatus: "failed",
      message:
        "That email could not be delivered. Check the address and try again. The board is still open.",
    };
  }
  return {
    boardPath: link.boardPath,
    propertiesUrl: link.propertiesUrl,
    email: link.email,
    emailStatus: delivery.emailStatus,
    message: delivery.message,
  };
}

export async function getLandlordAccess(token: string): Promise<
  | {
      token: string;
      email: string;
      jobs: Job[];
    }
  | undefined
> {
  if (!isBoardTokenShape(token)) return undefined;
  const [link] = await db
    .select()
    .from(boardToken)
    .where(eq(boardToken.token, token));
  if (!link || !isBoardTokenLive(link.expiresAt)) return undefined;

  const [anchor] = await db.select().from(job).where(eq(job.id, link.jobId));
  const jobs = await db.select().from(job).orderBy(asc(job.createdAt));
  return {
    token: link.token,
    email: link.email,
    jobs: jobsForLandlord(jobs, {
      email: link.email,
      anchorContact: anchor?.requesterContact,
    }),
  };
}

export async function loadPropertyForToken(
  token: string,
  key: string,
): Promise<
  | { kind: "expired" }
  | { kind: "missing"; token: string }
  | {
      kind: "ok";
      token: string;
      email: string;
      address: string;
      jobs: Job[];
    }
> {
  const access = await getLandlordAccess(token);
  if (!access) return { kind: "expired" };
  const address = addressFromKey(key);
  if (!address) return { kind: "missing", token: access.token };
  const jobs = access.jobs.filter((row) => sessionAddress(row) === address);
  if (jobs.length === 0) return { kind: "missing", token: access.token };
  return {
    kind: "ok",
    token: access.token,
    email: access.email,
    address,
    jobs,
  };
}
