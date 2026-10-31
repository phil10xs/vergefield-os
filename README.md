# VergeCare (Beta)

Property check-ins for the Meta AI Global Hackathon (indie track).
VergeCare is an AI caretaker for your property: check in, get an
organized Issues snag list and Issues & Bills Tracker Board in under a
minute — every visit remembered.

Standalone project with its own VergeCare brand mark, button
variants, status badges, page header, and list hero.

## Stack

- Next.js 15 + React 19 + TypeScript (web only, port **3002**)
- Tailwind CSS v4
- PostgreSQL 16 via Drizzle ORM (database `vergefield` on local Postgres;
  docker-compose alternative runs isolated on port **5433**)

Port 3002 avoids clashing with other local apps on 3000/3001.

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
Full walkthrough (env keys, seed contents, click path) is in
[instruction.md](./instruction.md).

## Checks

- `pnpm typecheck` — TypeScript
- `pnpm lint` — ESLint
- `pnpm test` — unit tests (vitest)
- `pnpm test:e2e` — end-to-end flow against a running server (see below)
- `GET /api/health` — app + database status (`{"ok":true,"db":"up"}`)

## Layout

```
src/app            Routes: / (→ /request), /request (check-in landing),
                   /request/checkin (film + submit), /request/[id] (visit report),
                   /track (Issues snag list + board views), /b/[token] (magic-link
                   properties, snag list and board), /api/health, /api/media
src/components     VergeCare UI: brand mark, button, status badges, page header,
                   app shell, board, capture
src/lib            Trade inference, board flow, payments, report sections,
                   session grouping
src/server         Reporting, media storage, board access, email, SAM grounding
src/db             Drizzle client + schema (job, site_report, site_media,
                   board_token, …)
src/styles         Brand tokens (colours)
scripts/seed.ts    Demo seed data (loads scripts/demo-fixture.json)
```

## Check-in flow

Check in → Visit report → Track → Board. Landlords, owners, managers and
tenants check in a property from `/request`: address, then one video per
issue narrating what they see — a video is enough to submit. Each video
becomes a session — trade auto-detected, reference issued — grouped under
its visit on the visit report (`/request/[id]`), with an Issues snag list
and a Meta Spark analysis block. `/track` holds every property's Issues snag
list; from the report, "View Board" opens the property's magic-link
Issues & Bills Tracker Board — no account, no password. Move cards
Requested → In progress → Completed → Paid; recording an amount marks the
bill. Uploads stay on this machine under `uploads/`.

Every screen is mobile-first and adaptive across phone, tablet, and laptop:
single-column forms, 44px touch targets, native camera capture on phones
degrading to pickers on desktop, and a horizontally scrolling board on
narrow screens.

## Meta video understanding

Each uploaded video gets two Meta (Muse Spark) passes: first video
understanding returns a speech transcript, a visual description, the trade,
and the object in frame; then a text-only triage pass grades severity
(low/medium/high) and a rough UK cost band. SAM 3.1 grounds the named
object to regions on a still frame. Either pass can fail silently — the
deterministic engine still titles and files every session.

Setup: add your Meta Model API key to `.env.local`:

```bash
META_MODEL_API_KEY=LLM_...
```

Without a key (or if analysis fails), requests still work end to end —
transcripts show as unavailable and the team uses the note plus the video's
own voice. Duration (20 s) and the one-video rule are enforced in the browser
before submit, with a server-side one-video backstop.

## Magic-link email (optional)

With SES configured (`SES_FROM_EMAIL` + AWS credentials in `.env.local`),
View Board emails the landlord link and opens the board. Without it, the UI
says nothing was sent and still opens the board on-screen — the demo never
needs email.

## Public repo vs private build

This branch is the public source-available build. What differs from the
private full build:

- Deploy stack lives in the private repo only: production Dockerfile,
  Caddy, `deploy/` configs and scripts, AWS runbooks, Vercel project.
- Demo media (cinematic cut, thumbnail) is not in git.

Everything user-facing — check-in, visit reports, Issues snag list,
magic-link Issues & Bills Tracker Board through Paid, payments, SAM
grounding — runs fully from this branch.

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

1. Landlord: open `/request`, start a check-in, enter the address, film one
   ≤20 s video per issue narrating what you see, send.
2. Visit report at `/request/[id]` — sessions, Issues snag list, Meta Spark
   analysis.
3. Snag list at `/track` — every property's visits and sessions.
4. View Board from the report — the property's Issues & Bills Tracker
   Board; move a card through to Paid with Pay now.

## Pre-submit test

Automated first (server must be running):

```bash
pnpm dev              # in one terminal → http://localhost:3002
pnpm test:e2e         # in another: submits a check-in, walks report →
                      # snag list → magic-link board, moves a card to Paid,
                      # cleans up
pnpm test             # unit tests
pnpm check:secrets    # must pass before every push
```

Then click through once in the browser (desktop + phone width): land →
check in with a real clip → confetti report → snag list → View Board →
moves to Paid with confetti. If the server ever stops responding, restart
`pnpm dev` (a huge raw gallery upload can wedge it — the in-app recorder
keeps clips small).

## License

Source-available under the Business Source License 1.1, © GoVerge Ltd —
see [LICENSE](./LICENSE). Any public use or redistribution must credit
"VergeCare by GoVerge Ltd" with a link to this repo.
