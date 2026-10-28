# VergeField OS

Chat-to-action FieldOps for the Meta AI Global Hackathon (indie track).
Type or speak a site update — VergeField OS creates and dispatches the job —
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
or speaking into `/jobs/new` (browser speech recognition, no key needed),
confirms the parsed draft, then on Capture records the tradesman, uploads
site photos or video, and adds spoken narration. The checklist feeds a
generated report with four sections: Site Condition, Hazards, Materials,
Next Steps. Uploads stay on this machine under `uploads/`.

## Public intake (Step 3)

Owners and tenants report issues at `/request` — text or voice description
plus photos, video, or direct camera capture on mobile. Requests land in the
trade dashboard with a `Requested` status; the engineer accepts or declines
from the job detail page (`/jobs/[id]`). The requester gets a reference code
and a private tracking link (`/request/[id]`).

Both the trade dashboard and the public pages are mobile-first: single-column
forms, 44px touch targets, and file inputs that open the camera (still or
video) on phones while degrading to pickers on desktop.
