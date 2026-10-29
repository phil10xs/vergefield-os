import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config as loadEnv } from "dotenv";
import { boardToken, job, siteMedia, siteReport } from "../src/db/schema";
import { BOARD_TOKEN_TTL_MS } from "../src/lib/board-token";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../.env.local") });
loadEnv({ path: resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/vergefield";

// 1px transparent PNG — keeps seeded photo rows renderable.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function seedPhoto(
  db: ReturnType<typeof drizzle>,
  params: {
    jobId: string;
    name: string;
    transcript?: string;
    visualDescription?: string;
  },
): Promise<void> {
  const dir = join(__dirname, "../uploads", params.jobId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, params.name), PIXEL);
  await db.insert(siteMedia).values({
    jobId: params.jobId,
    kind: "photo",
    filename: params.name,
    mimeType: "image/png",
    sizeBytes: PIXEL.length,
    transcript: params.transcript ?? null,
    visualDescription: params.visualDescription ?? null,
  });
}

async function main() {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db.delete(siteReport);
  await db.delete(siteMedia);
  await db.delete(boardToken);
  await db.delete(job);

  const [firstFit, snagging, commissioning] = await db
    .insert(job)
    .values([
      {
        title: "Electrician request — Hulme Point: second-fix electrics",
        siteName: "Hulme Point",
        status: "in_progress",
        priority: "high",
        assignee: "A. Mensah",
        tradesmanName: "A. Mensah",
        tradesmanTrade: "Electrician",
        paymentStatus: "due",
        paymentAmount: 18000,
        source: "public",
        requesterName: "Priya Nair",
        requesterContact: "priya@example.com",
        propertyAddress: "Hulme Point, Manchester",
        notes: "Consumer unit and socket fronts outstanding.",
      },
      {
        title: "General request — Hulme Point: snagging walk",
        siteName: "Hulme Point",
        status: "planned",
        priority: "medium",
        assignee: "J. Whitfield",
        source: "public",
        requesterName: "Priya Nair",
        requesterContact: "priya@example.com",
        propertyAddress: "Hulme Point, Manchester",
        notes: "Client walkthrough Friday 10:00.",
      },
      {
        title: "General request — Salford Quays: MVHR commissioning",
        siteName: "Salford Quays",
        status: "planned",
        priority: "medium",
        assignee: null,
        source: "public",
        requesterName: "Tom Becker",
        requesterContact: "tom@example.com",
        propertyAddress: "Salford Quays, Manchester",
        notes: "Awaiting ductwork sign-off.",
      },
    ])
    .returning();

  if (firstFit) {
    await db.insert(siteReport).values({
      jobId: firstFit.id,
      author: "A. Mensah",
      notes:
        "First floor wired. Two socket fronts back-ordered; photos attached on site.",
      mediaUrls: [],
    });
  }

  const address = "14 Rosebank Road, Manchester";
  const [leakingTap] = await db
    .insert(job)
    .values({
      title: "Plumber request — M14: Leaking tap",
      siteName: address,
      status: "requested",
      priority: "high",
      tradesmanTrade: "Plumber",
      source: "public",
      requesterName: "Jordan Lee",
      requesterContact: "07123 888888",
      propertyAddress: address,
      notes: "Leaking tap",
    })
    .returning();

  const [slippedSlate] = await db
    .insert(job)
    .values({
      title: "Roofer request — 14 Rosebank Road: Slipped slate",
      siteName: address,
      status: "submitted",
      priority: "medium",
      assignee: "D. Okafor",
      tradesmanName: "D. Okafor",
      tradesmanTrade: "Roofer",
      source: "public",
      requesterName: "Jordan Lee",
      requesterContact: "07123 888888",
      propertyAddress: address,
      paymentStatus: "due",
      paymentAmount: 8500,
      notes: "Slipped slate above the front path",
    })
    .returning();

  const [fixedLight] = await db
    .insert(job)
    .values({
      title: "Electrician request — 14 Rosebank Road: Flickering hallway light",
      siteName: address,
      status: "resolved",
      priority: "medium",
      assignee: "R. Ojo",
      tradesmanName: "R. Ojo",
      tradesmanTrade: "Electrician",
      source: "public",
      requesterName: "Jordan Lee",
      requesterContact: "07123 888888",
      propertyAddress: address,
      paymentStatus: "sent",
      paymentAmount: 12000,
      notes: "Flickering hallway light",
    })
    .returning();

  if (leakingTap) {
    await db.insert(siteReport).values({
      jobId: leakingTap.id,
      author: "Jordan Lee",
      notes: "Leaking tap — Plumber detected from the check-in video.",
      siteCondition: "Kitchen tap drips steadily into the sink; washer worn.",
      hazards: "Water pooling inside the under-sink cupboard — keep cleaning products clear.",
      materials: "Replacement washer and PTFE tape.",
      nextSteps: "Plumber visit booked; isolate the supply if dripping worsens.",
      mediaUrls: [],
    });
    await seedPhoto(db, {
      jobId: leakingTap.id,
      name: "seed-tap-1.png",
      transcript:
        "There's water dripping under the kitchen sink and the tap won't stop running.",
      visualDescription: "Close-up of a kitchen tap with water beading at the spout.",
    });
    await seedPhoto(db, { jobId: leakingTap.id, name: "seed-tap-2.png" });
  }

  if (slippedSlate) {
    await db.insert(siteReport).values({
      jobId: slippedSlate.id,
      author: "Jordan Lee",
      notes: "Slipped slate above the front path — roofer assigned.",
      siteCondition: "One slate slipped on the front slope; felt exposed.",
      hazards: "Loose slate above the walkway — keep clear until secured.",
      materials: "Replacement slate, clips, ladder access.",
      nextSteps: "Roofer scheduled; invoice due on completion.",
      mediaUrls: [],
    });
    await seedPhoto(db, { jobId: slippedSlate.id, name: "seed-slate-1.png" });
  }

  if (fixedLight) {
    await db.insert(siteReport).values({
      jobId: fixedLight.id,
      author: "R. Ojo",
      notes: "Flickering hallway light — fitting replaced and tested.",
      siteCondition: "Hallway light fitting replaced; steady on test.",
      hazards: "None outstanding — circuit tested safe.",
      materials: "Replacement LED fitting (supplied).",
      nextSteps: "Resolved — paid £120, receipt sent.",
      mediaUrls: [],
    });
    await seedPhoto(db, { jobId: fixedLight.id, name: "seed-light-1.png" });
  }

  let boardUrl = "";
  if (leakingTap) {
    const token = randomBytes(32).toString("hex");
    await db.insert(boardToken).values({
      token,
      jobId: leakingTap.id,
      email: "landlord@example.com",
      expiresAt: new Date(Date.now() + BOARD_TOKEN_TTL_MS),
    });
    boardUrl = `http://localhost:3002/b/${token}`;
  }

  console.log(
    `Seeded ${[firstFit, snagging, commissioning].filter(Boolean).length} portfolio check-ins + 3-session home visit + reports + photos.`,
  );
  if (leakingTap) {
    console.log(`Visit report: http://localhost:3002/request/${leakingTap.id}`);
  }
  if (boardUrl) {
    console.log(`Demo board: ${boardUrl}`);
  }
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
