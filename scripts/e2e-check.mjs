// End-to-end flow check for the public build. Runs the real HTTP journey
// against a running server (default http://localhost:3002):
//
//   check-in submit → visit report → snag list → magic-link board → moves
//   to Paid
//
// then deletes the test rows it created. Needs Postgres reachable with the
// same DATABASE_URL the server uses (read from .env.local). Email is not
// needed: the script mints the magic-link token row directly, the same row
// View Board would create before sending.
//
// Usage: pnpm test:e2e            (server already running on :3002)
//        BASE_URL=http://localhost:3009 node scripts/e2e-check.mjs

import { readFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import postgres from "postgres";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const ADDRESS = `E2E Test ${Date.now()} Lane, Manchester`;
const EMAIL = `e2e-${Date.now()}@example.com`;
const ROOT = new URL("..", import.meta.url).pathname;

function databaseUrl() {
  const line = readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row.startsWith("DATABASE_URL=") && !row.startsWith("#"));
  if (!line) throw new Error(".env.local has no DATABASE_URL");
  return line.slice("DATABASE_URL=".length).trim();
}

// Minimal ftyp-only clip: exercises the upload + analysis path without
// shipping a real video. Meta gracefully skips what it cannot read.
function tinyClip() {
  const box = Buffer.alloc(32);
  box.writeUInt32BE(32, 0);
  box.write("ftypisom", 4);
  return new File([box], "clip.mp4", { type: "video/mp4" });
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const text = await res.text();
  return { status: res.status, text, location: res.headers.get("location") };
}

// Next.js function-action forms carry a hidden $ACTION_ID field; mirror it.
function actionId(html) {
  const match = html.match(/name="(\$ACTION_ID_[^"]+)"/);
  if (!match) throw new Error("No server-action id found on page");
  return match[1];
}

async function postForm(path, fields, actionField) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append(actionField, "");
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: form,
    redirect: "manual",
    signal: AbortSignal.timeout(180_000),
  });
  return { status: res.status, location: res.headers.get("location") };
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) throw new Error(`e2e failed: ${name}${detail ? ` (${detail})` : ""}`);
}

const sql = postgres(databaseUrl(), { max: 1 });

try {
  // 1. Submit a check-in.
  const checkin = await get("/request/checkin");
  check("check-in page loads", checkin.status === 200, `HTTP ${checkin.status}`);
  const submitted = await postForm(
    "/request/checkin",
    { propertyAddress: ADDRESS, trade: "auto", media: tinyClip() },
    actionId(checkin.text),
  );
  check(
    "check-in submit redirects to report",
    submitted.status === 303 && !!submitted.location?.includes("/request/"),
    `HTTP ${submitted.status} → ${submitted.location}`,
  );
  const reportPath = new URL(submitted.location, BASE).pathname;

  // 2. Visit report shows the snag list.
  const report = await get(reportPath);
  check(
    "report shows Issues snag list",
    report.status === 200 && report.text.includes("Issues snag list"),
    `HTTP ${report.status}`,
  );
  check("report shows the address", report.text.includes(ADDRESS.slice(0, 20)));

  // 3. Snag list shows the session; mint a magic-link token for the board.
  const track = await get("/track");
  check(
    "track shows the session",
    track.status === 200 && track.text.includes(ADDRESS.slice(0, 20)),
    `HTTP ${track.status}`,
  );
  const [testJob] = await sql`
    SELECT id, status FROM job WHERE property_address = ${ADDRESS}
    ORDER BY created_at LIMIT 1
  `;
  if (!testJob) throw new Error("test job row not found");
  await sql`UPDATE job SET requester_contact = ${EMAIL} WHERE id = ${testJob.id}`;
  const token = randomBytes(24).toString("base64url");
  await sql`INSERT INTO board_token (token, job_id, email, expires_at)
    VALUES (${token}, ${testJob.id}, ${EMAIL}, NOW() + INTERVAL '7 days')`;
  const key = Buffer.from(ADDRESS, "utf8").toString("base64url");
  const boardPath = `/b/${encodeURIComponent(token)}/p/${encodeURIComponent(key)}/board`;

  const props = await get(`/b/${encodeURIComponent(token)}`);
  check(
    "magic link lists the property",
    props.status === 200 && props.text.includes(ADDRESS.slice(0, 20)),
    `HTTP ${props.status}`,
  );
  const board = await get(boardPath);
  check(
    "board shows the card as Requested",
    board.status === 200 &&
      board.text.includes("Requested") &&
      (board.text.includes("Trade detecting") ||
        board.text.includes("General")),
    `HTTP ${board.status}`,
  );

  // 4. Move the card along: Requested → In progress → Completed → Paid.
  const boardAction = actionId(board.text);
  const move = (direction) =>
    postForm(
      boardPath,
      { token, propertyKey: key, jobId: testJob.id, direction },
      boardAction,
    );
  const jobStatus = async () =>
    (await sql`SELECT status FROM job WHERE id = ${testJob.id}`)[0].status;
  await move("next");
  check("card moves to In progress", (await jobStatus()) === "in_progress");
  const done = await move("next");
  check("card moves to Completed", (await jobStatus()) === "completed");
  check(
    "completed move celebrates",
    (done.status === 303 && !!done.location?.includes("celebrate=1")) ||
      done.status === 200,
    `HTTP ${done.status}`,
  );
  const paid = await move("next");
  check("card moves to Paid", (await jobStatus()) === "paid");
  check(
    "paid move celebrates",
    (paid.status === 303 && !!paid.location?.includes("celebrate=paid")) ||
      paid.status === 200,
    `HTTP ${paid.status}`,
  );

  console.log("e2e: all checks passed");
} finally {
  // Cleanup: remove test rows (media/reports/tokens cascade) and upload folders.
  const rows = await sql`SELECT id FROM job WHERE property_address = ${ADDRESS}`;
  for (const row of rows) {
    rmSync(join(ROOT, "uploads", row.id), { recursive: true, force: true });
  }
  await sql`DELETE FROM job WHERE property_address = ${ADDRESS}`;
  await sql`DELETE FROM board_token WHERE email = ${EMAIL}`;
  console.log(`e2e: cleaned up ${rows.length} test job(s)`);
  await sql.end();
}
