# VergeSnag (Beta) — local setup

Property check-ins: film an issue, get a visit report, and track it on a snag list and property board. There is no login. The demo runs without a Meta API key.

## Prerequisites

- **Node.js 20 or newer.** This repo does not pin a version. TypeScript types target Node 20 (`@types/node` ^20). Next.js 15.5 needs Node.js 18.18 or newer.
- **pnpm 9 or newer.** `pnpm-lock.yaml` is lockfileVersion 9. No pnpm version is pinned in `package.json`.
- **PostgreSQL 16**, database name `vergefield`.
  - Default: a local Postgres on port **5432** (for example Homebrew). Create the database once: `createdb vergefield`. Skip that if it already exists.
  - Alternative: `docker compose up -d` from the repo root. That starts Postgres 16 on host port **5433** (user `postgres`, password `postgres`, database `vergefield`) so it does not share port 5432 with other local databases.

## Install

```bash
cd /Users/igbobaphilip/Projects/vergefield-os
pnpm install
```

## Environment

Copy the example file to `.env.local` in the repo root (Next.js loads this file; it is gitignored):

```bash
cp .env.example .env.local
```

Keys the app actually reads (names from `.env.example` — do not commit real values):

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Drizzle and the seed script use this. If it is unset, the code falls back to `postgres://postgres:postgres@localhost:5433/vergefield` (the Docker database). The example file’s default is a local user on port 5432 and database `vergefield`. Point this at whichever Postgres you started. |
| `NEXT_PUBLIC_APP_URL` | Public origin of this app, used for absolute links. The example value is `http://localhost:3002`. |
| `META_MODEL_API_KEY` | Optional Meta Model API key. When set, uploaded videos are sent for a speech transcript and a short visual description. Leave it empty to run the demo: check-in still works, and transcripts show as unavailable. |

There is no auth secret, session secret, or other required key.

Push the schema once before the first seed (and again after schema changes):

```bash
pnpm db:push
```

## Seed

```bash
pnpm db:seed
```

This **resets** the database to the 6-check-in mock fixture in `scripts/demo-fixture.json`. It deletes existing jobs, reports, media rows, and board tokens, then inserts the fixture. Placeholder 1×1 PNGs are written under `uploads/`.

## Start

```bash
pnpm dev
```

`package.json` fixes the dev and production scripts to port **3002** (`next dev --port 3002` and `next start --port 3002`). `next.config.ts` does not change the port. Open the URL the terminal prints. With nothing else bound to that port, that is [http://localhost:3002](http://localhost:3002).

`pnpm start` serves a production build (`pnpm build` first) on the same port.

## What the seed contains

Six public check-ins, four visit reports, and four placeholder photos. Amounts on screen are pounds (stored in pence). Same-day issues at the same address are one visit.

**Hulme Point, Manchester** — Priya Nair, `priya@example.com` (two sessions, one visit)

- Electrician request — Hulme Point: second-fix electrics. Status `in progress`, high priority, assignee A. Mensah (Electrician), payment **Due £180**. Note: consumer unit and socket fronts outstanding. Report by A. Mensah: first floor wired; two socket fronts back-ordered.
- General request — Hulme Point: snagging walk. Status `planned`, medium priority, assignee J. Whitfield, no payment. Note: client walkthrough Friday 10:00. No report and no photo.

**Salford Quays, Manchester** — Tom Becker, `tom@example.com` (one session)

- General request — Salford Quays: MVHR commissioning. Status `planned`, medium priority, unassigned, no payment. Note: awaiting ductwork sign-off. No report and no photo.

**14 Rosebank Road, Manchester** — Jordan Lee, `07123 888888` (three sessions, one home visit)

- Plumber request — M14: Leaking tap. Status `requested`, high priority, trade Plumber, no assignee, no payment. Report covers a dripping kitchen tap, water under the sink, a replacement washer, and isolating the supply if it worsens. Two photos: `seed-tap-1.png` (transcript: “There's water dripping under the kitchen sink and the tap won't stop running.” plus a visual description of the tap) and `seed-tap-2.png` (no transcript).
- Roofer request — 14 Rosebank Road: Slipped slate. Status `submitted`, medium priority, D. Okafor (Roofer), payment **Due £85**. Report: one slate slipped above the front path. Photo: `seed-slate-1.png`.
- Electrician request — 14 Rosebank Road: Flickering hallway light. Status `resolved`, medium priority, R. Ojo (Electrician), payment **Sent £120**. Report: fitting replaced and tested; receipt sent. Photo: `seed-light-1.png`.

The seed does not create a magic-link board token. It clears the `board_token` table. On this branch, `/b/[token]` is a placeholder for any token.

Useful ids after seed:

- Rosebank visit (leaking tap, and the other two Rosebank sessions on the same report): `/request/717ba6b3-2c08-4fbf-8d01-fe61a3b1432d`
- Slipped slate: `/request/6dcd8a4e-cae9-480e-8d7e-b3778c2eb22d`
- Hallway light: `/request/e59ae761-cdb2-4493-9fc8-0bcefc418647`
- Hulme electrics: `/request/8efd86e2-220b-47ae-980a-28e1e39d399e`
- Hulme snagging walk: `/request/91213d95-f6d7-4a2e-818f-e531494de680`
- Salford MVHR: `/request/3dae3709-b020-43e6-8d5d-2de80cd28992`

## Check that it works

No account is required.

1. `GET /api/health` returns `{"ok":true,"db":"up"}`.
2. `/` redirects to `/request` (“Check in your property”). **Start a check-in** goes to `/request/checkin` (name, address, contact, optional business name, urgency, one video per issue up to 20 seconds).
3. `/track` (and `/snags`, which redirects there) lists **6 sessions** in three properties: Hulme Point, Salford Quays, and 14 Rosebank Road. Rosebank shows the leaking tap (`requested`), slipped slate (`submitted`, Due £85), and hallway light (`resolved`, Sent £120).
4. Open `/request/717ba6b3-2c08-4fbf-8d01-fe61a3b1432d`. The visit report includes all three Rosebank sessions, the tap transcript, and the placeholder photos from `/api/media/...`. **View my property fixes on board** opens `/board?property=14%20Rosebank%20Road%2C%20Manchester` with columns Requested, Planned, In progress, Submitted, and Resolved.
5. `/board` lists the three property addresses. Hulme Point’s board shows second-fix electrics under In progress (Due £180) and the snagging walk under Planned.
6. `/b/demo` (any token) shows **Board not in this build** and a link back to `/request`. Magic-link boards are not in this branch, and seed does not insert a token.

Automated checks:

```bash
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm lint        # eslint
pnpm check:secrets
```

## Prop videos

Masters stay on Google Drive. This repo stores the share link only. Do not copy the files in, and do not commit the video bytes.

- Local source folder: **VergeList-43 Grosvenor** (on the Desktop). Leave the files there.
- Drive file (public page title): `VergeList-43 Grosvenor.zip`
- Share URL: https://drive.google.com/file/d/1Zm9FlpDPe27eUYOts5ier8eIkeoWOJz1/view?usp=sharing
- File id: `1Zm9FlpDPe27eUYOts5ier8eIkeoWOJz1`

That URL is a Drive preview/share link (`/file/d/.../view`), not a direct video stream URL. A `<video src>` will not play it as-is. Check-in clips in the app are separate: they are uploaded files stored as `site_media` and served from `/api/media/...`.
