import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config as loadEnv } from "dotenv";
import { job, siteReport } from "../src/db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../.env.local") });
loadEnv({ path: resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/vergefield";

async function main() {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db.delete(siteReport);
  await db.delete(job);

  const [firstFit, snagging, commissioning] = await db
    .insert(job)
    .values([
      {
        title: "Second-fix electrics — Plot 12",
        siteName: "Hulme Point",
        status: "in_progress",
        priority: "high",
        assignee: "A. Mensah",
        notes: "Consumer unit and socket fronts outstanding.",
      },
      {
        title: "Snagging walk — Block B",
        siteName: "Hulme Point",
        status: "scheduled",
        priority: "medium",
        assignee: "J. Whitfield",
        notes: "Client walkthrough Friday 10:00.",
      },
      {
        title: "Commission MVHR — Plot 8",
        siteName: "Salford Quays",
        status: "planned",
        priority: "medium",
        assignee: null,
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

  console.log(
    `Seeded ${[firstFit, snagging, commissioning].filter(Boolean).length} jobs + 1 site report.`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
