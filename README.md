# VergeSnag (Beta)

Property check-ins for the Meta AI Global Hackathon (indie track),
powered by the VergeSnag AI engine. Check in on your property, get an
organized snag list & tracker board in under a minute — every visit
remembered forever.

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
src/app            Routes: / (→ /request), /request (check-in landing),
                   /request/checkin (film + submit), /request/[id] (visit report),
                   /track (Issues snag list), /board (read-only Issues & Bill
                   Tracker board), /b/[token] (placeholder), /api/health, /api/media
src/components     Reused GoVerge UI: button, status badges, page header, list hero
src/lib            Trade inference, report sections, session grouping
src/server         Reporting and media storage logic
src/db             Drizzle client + schema (job, site_report, site_media, …)
src/styles         Brand tokens (colours)
scripts/seed.ts    Demo seed data (loads scripts/demo-fixture.json)
```

## Check-in flow

Check in → Visit report → Track. Landlords, owners and tenants check in a
property from `/request`: name, contact, address, then one video per issue
(up to 20 seconds each) narrating what they see. Each video becomes a
session — trade auto-detected, reference issued — grouped under its visit on
the visit report (`/request/[id]`), with an Issues snag list and a Meta Spark
analysis block. `/track` holds every property's Issues snag list; from the
report, "View my Issues & Bills Tracker Board" opens the property's read-only
board at `/board`. Uploads stay on this machine under `uploads/`.

Every screen is mobile-first and adaptive across phone, tablet, and laptop:
single-column forms, 44px touch targets, camera capture on phones degrading
to pickers on desktop, and a horizontally scrolling board on narrow screens.

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

## Public repo vs internal build

This branch is the public source-available build. What differs from the
private full build:

- `src/app/b/[token]/page.tsx` — magic-link board placeholder (full
  email-link board lives in the private repo only).
- `src/server/analyze-video.ts` — the Meta Spark prompt (mock prompt here).
- Removed outright: interactive kanban (`TrackBoard`), email board links
  (`board-access`, `board-mail`, `BoardLinkRequest`), and the old trade
  dashboard.

Everything else — check-in, visit reports, Issues snag list, read-only
Issues & Bills Tracker Board — runs fully from this branch.

## Secrets rule

What can be pushed: all source, docs, and config. What stays local: API keys
and credentials in `.env.local` (gitignored), `*.pem` / `*.key` files, and
anything under `secrets/`. The demo runs fully without a key (Meta analysis
shows as unavailable); with `META_MODEL_API_KEY` set locally, video analysis
goes live. Run `pnpm check:secrets` before every push — it fails if a
Meta-style key or private key appears in tracked files.

## Demo in 5 minutes

```bash
pnpm db:seed   # reset to the 6-check-in mock fixture
pnpm dev       # http://localhost:3002
```

1. Landlord: open `/request`, start a check-in, film one ≤20 s video per
   issue narrating what you see, send.
2. Visit report at `/request/[id]` — sessions, Issues snag list, Meta Spark
   analysis.
3. Snag list at `/track` — every property's visits and sessions.
4. Issues & Bills Tracker Board from the report — the property's read-only
   board.
