import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { mkdir, writeFile } from "fs/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config as loadEnv } from "dotenv";
import { boardToken, job, siteMedia, siteReport } from "../src/db/schema";
import fixture from "./demo-fixture.json";

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

interface FixtureJob {
  id: string;
  title: string;
  site_name: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  tradesman_name: string | null;
  tradesman_trade: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  source: string;
  requester_name: string | null;
  requester_contact: string | null;
  business_name: string | null;
  property_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FixtureReport {
  id: string;
  job_id: string;
  author: string;
  notes: string | null;
  site_condition: string | null;
  hazards: string | null;
  materials: string | null;
  next_steps: string | null;
  media_urls: string[];
  created_at: string;
}

interface FixtureMedia {
  id: string;
  job_id: string;
  kind: string;
  filename: string;
  mime_type: string;
  narration: string | null;
  transcript: string | null;
  visual_description: string | null;
  detected_trade?: string | null;
  created_at: string;
}

async function main() {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db.delete(siteReport);
  await db.delete(siteMedia);
  await db.delete(boardToken);
  await db.delete(job);

  for (const entry of fixture.jobs as FixtureJob[]) {
    await db.insert(job).values({
      id: entry.id,
      title: entry.title,
      siteName: entry.site_name,
      status: entry.status,
      priority: entry.priority as "low" | "medium" | "high",
      assignee: entry.assignee,
      tradesmanName: entry.tradesman_name,
      tradesmanTrade: entry.tradesman_trade,
      paymentStatus: entry.payment_status,
      paymentAmount: entry.payment_amount,
      source: entry.source,
      requesterName: entry.requester_name,
      requesterContact: entry.requester_contact,
      businessName: entry.business_name,
      propertyAddress: entry.property_address,
      notes: entry.notes,
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at),
    });
  }

  for (const entry of fixture.reports as FixtureReport[]) {
    await db.insert(siteReport).values({
      id: entry.id,
      jobId: entry.job_id,
      author: entry.author,
      notes: entry.notes,
      siteCondition: entry.site_condition,
      hazards: entry.hazards,
      materials: entry.materials,
      nextSteps: entry.next_steps,
      mediaUrls: entry.media_urls,
      createdAt: new Date(entry.created_at),
    });
  }

  for (const entry of fixture.media as FixtureMedia[]) {
    const dir = join(__dirname, "../uploads", entry.job_id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, entry.filename), PIXEL);
    await db.insert(siteMedia).values({
      id: entry.id,
      jobId: entry.job_id,
      kind: entry.kind as "photo" | "video",
      filename: entry.filename,
      mimeType: entry.mime_type,
      sizeBytes: PIXEL.length,
      narration: entry.narration,
      transcript: entry.transcript,
      visualDescription: entry.visual_description,
      detectedTrade: entry.detected_trade ?? null,
      createdAt: new Date(entry.created_at),
    });
  }

  const jobs = fixture.jobs as FixtureJob[];
  const media = fixture.media as FixtureMedia[];
  const withMedia = media.length > 0 ? media[0]?.job_id : jobs[0]?.id;
  console.log(
    `Seeded ${jobs.length} demo check-ins + ${fixture.reports.length} reports + ${media.length} mocked captures from demo-fixture.json.`,
  );
  if (withMedia) {
    console.log(`Visit report: http://localhost:3002/request/${withMedia}`);
  }
  console.log("Issues snag list: http://localhost:3002/track");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
