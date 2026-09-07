# Implementation

A real, running implementation of the architecture described in `../ADRs/`, realizing the four use cases (`../usecases/`) and evolving the static wireframes (`../wireframes/`) into an integrated, API-backed webapp — database, REST services, and UI, plus the automated test suite that verifies it.

**Start here:** [`docs/production-readiness-report.md`](docs/production-readiness-report.md) for the honest go/no-go assessment. Then:

- [`docs/database-schema.md`](docs/database-schema.md) — the *why* behind every table
- [`docs/api-contracts.md`](docs/api-contracts.md) — every endpoint, what it enforces, what's real vs. a documented stand-in
- [`docs/module-service-map.md`](docs/module-service-map.md) — why this runs as one modular-monolith process, not seven microservices
- [`docs/test-strategy.md`](docs/test-strategy.md) — frameworks, the full test case catalog, actual results, and the real bugs the suite caught

## Stack

Node.js + Express + PostgreSQL, plain HTML/CSS/JS on the frontend (ES modules, no build step) — matching `wireframes/`'s existing style rather than introducing a new framework. `node:test` for unit/integration tests, Puppeteer for the browser E2E smoke test.

## Running it locally

### 1. Database (one-time setup, then reusable)

Postgres's data directory is deliberately **not** inside this repo (which lives under `~/Documents`, i.e. iCloud-synced on macOS — a live database data directory should never sit in a cloud-synced folder; file-sync daemons contending with Postgres's own file I/O causes severe, confusing slowdowns). It's initialized in `/tmp` instead:

```bash
initdb -D /tmp/von-digitalis-pgdata --auth=trust --username=vondigitalis
pg_ctl -D /tmp/von-digitalis-pgdata -l /tmp/von-digitalis-pgdata/pg.log \
  -o "-p 5433 -k /tmp/von-digitalis-pgsockets -h localhost" start

psql -h localhost -p 5433 -U vondigitalis -d postgres -c "CREATE DATABASE von_digitalis;"
psql -h localhost -p 5433 -U vondigitalis -d von_digitalis -f db/schema.sql
psql -h localhost -p 5433 -U vondigitalis -d von_digitalis -f db/seed.sql
```

To stop it later: `pg_ctl -D /tmp/von-digitalis-pgdata stop`. To reset to clean seed data: drop + recreate the database and re-run the two `.sql` files above — safe and fast (a few seconds).

### 2. Server (API + serves the webapp)

Same cloud-sync caution applies to `node_modules` — if `npm install` or imports feel mysteriously slow, check `node_modules` isn't a large, aging, possibly-evicted directory inside a synced folder. This repo's `implementation/server/node_modules` is `.gitignore`d either way; a fresh `npm install` always fixes it.

```bash
cd server
npm install
npm start          # http://localhost:4000 — API under /api, webapp served at /
```

### 3. Try it

Open `http://localhost:4000/index.html`. Sign in as one of the three seeded staff demo accounts (Keeper / Operations / Admin — one click each, no password) or as a visitor with any email. Each role only sees the apps it's scoped to (ADR016).

### 4. Tests

```bash
cd server
npm test            # 46 unit + integration tests, node:test, ~10s, no browser needed
npm run e2e          # real Chrome E2E — requires the server already running (npm start, separately)
```

## What's real vs. a documented stand-in

This is not a toy — the database is real Postgres, the guardrails are enforced server-side and covered by tests that assert the *rejection* paths, and the E2E test drives an actual browser through an actual override flow and confirms it survived a hard page reload. Two things are explicit, intentional stand-ins for infrastructure this kata prototype can't reasonably stand up:

- **Authentication** (`server/src/middleware/auth.js`) — a base64 token, not real OAuth/OIDC. Swapping this one file is the entire migration path to ADR016's real design; no route handler changes.
- **Object storage** for piranha captures — a string column (`capture_object_key`), no real upload endpoint yet.

Both are called out explicitly, not silently, in [`docs/api-contracts.md`](docs/api-contracts.md) and the [production readiness report](docs/production-readiness-report.md).
