# VergeField OS

Chat-to-action FieldOps for the Meta AI Global Hackathon (indie track).
Type a site update — VergeField OS creates and dispatches the job —
then roll captures into a shareable site photo–video report.

Separate project from GoVerge. It reuses GoVerge's brand tokens, button
variants, status badges, page header, and list hero (copied, not linked),
without modifying the GoVerge repo.

## Stack

- Next.js 15 + React 19 + TypeScript (web only, port **3002**)
- Tailwind CSS v4
- PostgreSQL 16 via Drizzle ORM (database `vergefield` on local Postgres;
  docker-compose alternative runs isolated on port **5433**)

Port 3002 avoids clashing with GoVerge's 3000/3001.

## Setup

```bash
cd /Users/igbobaphilip/Projects/vergefield-os

# 1. Postgres: local Homebrew instance (default, database `vergefield`),
#    or `docker compose up -d` for the isolated container on port 5433
#    (then use the docker DATABASE_URL from .env.example).
createdb vergefield   # once; skip if the database already exists

# 2. Install
pnpm install

# 3. Push schema + seed demo data
pnpm db:push
pnpm db:seed

# 4. Run
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002) in a browser.

## Checks

- `pnpm typecheck` — TypeScript
- `pnpm lint` — ESLint
- `GET /api/health` — app + database status (`{"ok":true,"db":"up"}`)

## Layout

```
src/app            Routes: / (dashboard), /jobs, /jobs/new (chat),
                   /jobs/[id]/{capture,checklist,report}, /api/health, /api/media
src/components     Reused GoVerge UI: button, status badges, page header, list hero
src/lib            Chat parser, checklist template, trades
src/server         Reporting, checklist, and media storage logic
src/db             Drizzle client + schema (job, site_report, site_media, …)
src/styles         Brand tokens (colours)
scripts/seed.ts    Demo seed data
```

## Workflow (Step 2)

Jobs → Capture → Checklist → Report. The engineer creates a job by typing
into `/jobs/new`, confirms the parsed draft, then on Capture records the
tradesman, uploads site photos or video, and adds written narration.
The checklist feeds a
generated report with four sections: Site Condition, Hazards, Materials,
Next Steps. Uploads stay on this machine under `uploads/`.

## Public intake (Step 3)

Owners and tenants report issues at `/request` — name, address, contact, one
video up to 20 seconds, plus stills. The trade is detected automatically from
the video. Requests land in the trade dashboard with a `Requested` status;
the engineer accepts or declines from the job detail page (`/jobs/[id]`).
The requester gets a reference code and a private tracking link
(`/request/[id]`).

Both the trade dashboard and the public pages are mobile-first: single-column
forms, 44px touch targets, and file inputs that open the camera (still or
video) on phones while degrading to pickers on desktop.

## Meta video understanding (Step 4)

Each uploaded video is sent to Meta (Muse Spark 1.2 video understanding),
which returns a speech transcript and a short visual description. The title
and trade are inferred from the transcript plus the requester's note; the
tradesman confirms or corrects both when accepting. Photos skip analysis.

Setup: add your Meta Model API key to `.env.local`:

```bash
META_MODEL_API_KEY=LLM_...
```

Without a key (or if analysis fails), requests still work end to end —
transcripts show as unavailable and the team uses the note plus the video's
own voice. Duration (20 s) and the one-video rule are enforced in the browser
before submit, with a server-side one-video backstop.

## Demo in 5 minutes

```bash
pnpm db:seed   # reset to 3 jobs + 1 report + 1 demo request
pnpm dev       # http://localhost:3002
```

1. Owner: open `/request`, film ≤20 s narrating the issue, send.
2. Track the reference at `/request/[id]` — transcript, trade, status.
3. Trade: open the job from `/jobs`, confirm title and trade, accept.
4. Capture stills, run the checklist, generate the report.
5. Back on tracking: the full story, reference to report.
