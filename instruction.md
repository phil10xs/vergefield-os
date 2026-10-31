# VergeCare (Beta) — local setup

Film a property issue, get a visit report, track it to Paid. No login.
Runs without any API key.

## 1. Prerequisites

- Node.js 20+, pnpm 9+
- PostgreSQL 16 with a `vergefield` database (`createdb vergefield`), or
  `docker compose up -d` from this folder (isolated Postgres on port 5433)

## 2. Install and configure

```bash
pnpm install
cp .env.example .env.local   # then edit DATABASE_URL if needed
pnpm db:push                  # create tables (re-run after schema changes)
pnpm db:seed                  # reset to the demo fixture
```

| Key | Needed? |
| --- | --- |
| `DATABASE_URL` | Yes — Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes — `http://localhost:3002` locally |
| `META_MODEL_API_KEY` | No — enables video transcripts/analysis; without it the flow still works |
| `SES_FROM_EMAIL` + AWS keys | No — sends magic-link emails; without it the board still opens on-screen |

## 3. Run

```bash
pnpm dev   # → http://localhost:3002
```

## 4. Five-minute demo path

1. `GET /api/health` → `{"ok":true,"db":"up"}`
2. `/request` → Start a check-in → address + one short narrated video per issue → send
3. Visit report → sessions, Issues snag list, analysis (or "unavailable" keyless)
4. `/track` → every property's snag list
5. **View Board** on the report → magic-link board → move cards to Paid (confetti)

Seeded shortcuts: Rosebank visit `/request/717ba6b3-2c08-4fbf-8d01-fe61a3b1432d`
(leaking tap + photos), Hulme electrics `/request/8efd86e2-220b-47ae-980a-28e1e39d399e`.

## 5. Checks

```bash
pnpm typecheck && pnpm lint && pnpm test   # static + unit
pnpm test:e2e    # live flow vs your running server (needs .env.local DATABASE_URL)
pnpm check:secrets   # run before every push
```

## Notes

- The seed **resets** the database (jobs, reports, media, board tokens) and
  writes placeholder PNGs under `uploads/` (gitignored, stays on your machine).
- Check-in clips are uploads stored as `site_media`, served from `/api/media/...`.
- Demo footage masters live on Google Drive, not in this repo:
  `VergeList-43 Grosvenor.zip`
  (https://drive.google.com/file/d/1Zm9FlpDPe27eUYOts5ier8eIkeoWOJz1/view?usp=sharing).
  It is a preview link, not a streamable `<video src>`.
