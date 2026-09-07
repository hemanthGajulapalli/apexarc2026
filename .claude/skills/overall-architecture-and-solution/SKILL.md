---
name: overall-architecture-and-solution
description: Whole-system reference for the Von Digitalis Estates project — the problem, the solution, every component/service, the database, the UI/webapp, scalability posture, testing, and deployment, all in one map. Use this FIRST when orienting on the project as a whole, when a request spans more than one use case or module, or when asked about architecture, components, services, scalability, testing strategy, or deployment/rollout — then drill into the six scoped skills (uc01–uc04, platform-foundations, ai-governance-verification) for depth.
---

# Von Digitalis Estates — Overall Architecture & Solution

This is the orientation skill. It gives the whole map; the six sibling skills give the depth on one piece of it. Don't duplicate their detail here when answering — point at them.

## The problem, in one paragraph
The 72nd Countess Von Digitalis inherited an estate with three monetizable assets (40 historic rides, a 200+ animal exotic collection across 55 enclosures, the grounds themselves) and needs it profitable: grow from ~5,000 to 15,000 visitors/day within 3 years, on a budget-conscious estate with patchy WiFi. Full brief: [`business-requirements/von-digitalis-kata.md`](../../../business-requirements/von-digitalis-kata.md). Three business problems drove everything: no popularity visibility, animal-care cost/welfare risk, low visitor return rate.

## The solution, in one paragraph
Four AI-assisted use cases (UC01–UC04, see their own skills), built on an event-driven, modular-service architecture over LoRaWAN/MQTT (ADR001/ADR012), with **every AI output gated behind mandatory human confirmation** (ADR007) and **every model deploy gated behind golden-set regression** (ADR011/ADR020) — the two guardrails that recur through the entire project and that judging criteria score most directly. Solution overview + diagrams: [`README.md`](../../../README.md), [`assets/use-cases-overview.svg`](../../../assets/use-cases-overview.svg).

## Components & services

Five services from ADR012, plus two added later (ADR021/ADR022) after comparing the architecture against what the wireframes actually showed running:

| Service | ADRs | Owns |
|---|---|---|
| Ingestion | ADR001 | Zone-gateway → LoRaWAN concentrator → MQTT → cloud path; store-and-forward buffering |
| Popularity Analytics ("Ops AI") | ADR003/004/021 | Ticket-scan+BLE aggregation, forecasting, staff/investment recommendations |
| Animal Monitoring | ADR002/005/006/007 | Health/feeding alerts, population counting, all keeper confirm/dismiss guardrails |
| Ticketing Integration | ADR008/009/018/022 | Purchase, loyalty, personalization, concierge ("Customer GenAI") |
| Identity & Access | ADR016 | OAuth/OIDC stand-in, staff RBAC |
| AI Inference / Governance | ADR010/011/020 | Model registry, golden-set gate, drift, overrides |

**Real code:** all six run as one Express process — a deliberate **modular monolith**, not seven microservices, because ADR012 itself explicitly rejected fine-grained microservices as over-engineered at this scale. Each service is still its own router + business-logic module in its own directory (`implementation/server/src/services/<name>/`), independently extractable later if a real scaling need ever justifies it. Full reasoning: [`implementation/docs/module-service-map.md`](../../../implementation/docs/module-service-map.md).

## Database

PostgreSQL 14+, 26 tables, one schema file: [`implementation/db/schema.sql`](../../../implementation/db/schema.sql), seeded via [`implementation/db/seed.sql`](../../../implementation/db/seed.sql). ADR014's three storage types, mapped:

1. **Relational** (the schema, in full) — identity, tickets, enclosures, alerts, models, audit trail.
2. **Time-series** — modeled as regular Postgres tables with time-bucketed indexes (`popularity_events`, `popularity_aggregates_hourly/daily`, `sensor_readings`, `drift_metrics`) — same shape a real TSDB (TimescaleDB/InfluxDB) would use; only the engine differs in production.
3. **Object storage** — not a SQL concern; `population_counts.capture_object_key` is the reference-key seam. **Not implemented** (no real upload endpoint yet) — an explicit, documented gap.

Full rationale per table: [`implementation/docs/database-schema.md`](../../../implementation/docs/database-schema.md).

## UI / Webapp

Two layers exist and serve different purposes — don't confuse them:

- **`wireframes/*.html`** — static-content interaction-design reference (5 files: landing page + 4 apps), the design source of truth, screenshotted into `assets/ops-dashboard-*.png` and `assets/vet-console-alert-feed.png` for the docs/README.
- **`implementation/webapp/*.html`** — the real, API-wired evolution of those wireframes: `index.html` (sign-in + role-gated app launcher), `ops-dashboard.html`, `vet-console.html`, `ai-governance-console.html`, `customer-app.html`, plus a shared design system (`shared/design-system.css`) and fetch/UX helper layer (`shared/api.js` — loading skeletons, empty states, toasts, busy-button double-submit guards).

Both are plain HTML/CSS/JS (ES modules, no build step, no framework) — a deliberate stack choice matching the wireframes rather than introducing new tooling.

## Scalability

- **Growth target:** 5,000 → 15,000 visitors/day over 3 years (`assets/demand-chart.svg`). No load test has been run against this target yet — named explicitly as a gap, not silently skipped (see Testing & Deployment below).
- **Architectural characteristics posture** (`assets/existing-architectural-characteristics.svg`, priority order): Reliability → Availability under patchy connectivity → Cost Efficiency → **Auditability** → Elasticity → Adaptability. Auditability and Adaptability are *deliberately raised* above the base system's bar by the AI verification (ADR011) and provider-portability (ADR010) work — see `other_design_docs/architecture-characteristics.md`.
- **The connectivity scaling move:** LoRaWAN's fan-in topology collapses "~95 individually-reliable zones" down to "3 reliably-connected gateway concentrators" (ADR001) — the single biggest scale/cost lever in the whole architecture, chosen after consulting the estate's IoT/hardware lead.
- **The batch-not-streaming move:** ADR004 (and ADR021, built on top of it) deliberately avoids streaming infrastructure — hourly/daily aggregation is sized to the *actual decision cadence* (staffing, investment), not a theoretical real-time maximum. Revisit only if a future feature (e.g. live queue-time displays) genuinely needs minute-level freshness.
- **Service scaling:** the modular-monolith today can split along its existing service-router boundaries the moment a real scaling need appears (see module-service-map.md) — the seams are already drawn.
- **Fitness functions** for reliability/cost/adaptability/security are named (not yet automated) in `other_design_docs/fitness-functions.md`.

## Testing

Two-track approach (`usecases/test-approach.md`, `assets/test-approach-diagram.svg`): a conventional pyramid for deterministic components, golden-set/drift/human-feedback for AI components, converging on shared observability (not yet built — see platform-foundations skill).

**Actually executed, with real results** — this is the differentiator versus a described-only test strategy:
- `implementation/server/test/` — 46 unit + integration tests (`node:test`, zero mocking, real Postgres), **46/46 passing**. Caught 3 real bugs before they shipped (a UTC/local-timezone forecast bug, a swapped-argument alert-tiering bug, a test-fixture collision) — specifics in [`implementation/docs/test-strategy.md`](../../../implementation/docs/test-strategy.md).
- `implementation/server/e2e/smoke.mjs` — real Puppeteer browser E2E (`npm run e2e`), **9/9 passing**: signs in, drills into a blocked model, verifies its test-result breakdown, exercises the override guardrail, and confirms the result survives a hard page reload (proving server-side persistence, not client-side illusion).
- Full test case catalog (what each test proves, mapped to ADRs) in the same test-strategy doc.
- Explicit non-coverage: load/performance, real ML model accuracy, real OAuth, LoRaWAN/MQTT hardware failure modes, security/pentest — named, not silently skipped.

## Deployment

- **Pipeline design (ADR020):** single shared CI/CD pipeline, independent deploy path for AI models, gated by the golden-set suite — a failing result is a hard blocker requiring an explicit, attributed override. See the **ai-governance-verification** skill for how this is actually enforced in running code.
- **Rollout phasing** (`other_design_docs/roll-out-strategy.md`, `assets/rollout-strategy.svg`): Phase 0 foundations (ticketing, RF survey → LoRaWAN, OAuth identity, observability, simple loyalty) → Phase 1 popularity analytics live → Phase 2 animal monitoring piloted on 2–3 tiers + piranha counting → Phase 3 scale to all 55 enclosures + evaluate the UC04 Phase Two trigger. Every phase gated by pilot validation, not the calendar.
- **Running this codebase locally:** [`implementation/README.md`](../../../implementation/README.md) has exact commands. Short version: init/start a local Postgres (deliberately kept in `/tmp`, not inside this iCloud-synced repo — see that README for why), apply `schema.sql` + `seed.sql`, then `cd implementation/server && npm install && npm start`.
- **Production readiness:** [`implementation/docs/production-readiness-report.md`](../../../implementation/docs/production-readiness-report.md) is the honest go/no-go — core guardrails and API surface are ✅ ready (re-runnable evidence, not just claimed); auth and object storage are 🔴 explicit stand-ins that must be replaced before real traffic; load testing, security review, and observability are ⚪ not yet assessed.

## Repo map

```
ADRs/                    22 architecture decisions (adr001–adr022)
ADR-Spikes/               Supporting spikes, one per ADR
usecases/                UC01–UC04 + test-approach docs
assets/                   Diagrams (svg) + real screenshots (png)
wireframes/               Static interaction-design HTML (source of truth for UI)
implementation/           The real, running system
  db/                      PostgreSQL schema + seed
  server/                  Express backend (6 services) + tests + e2e
  webapp/                  Real API-wired HTML/CSS/JS
  docs/                    Schema, API contracts, module map, test strategy, readiness report
business-requirements/    Kata brief, glossary
other_design_docs/        Cost analysis, fitness functions, rollout strategy, architecture characteristics
adviceforum/               Consolidated ADR decision + advice summary
.claude/skills/            This skill + the 6 scoped ones (uc01–uc04, platform-foundations, ai-governance-verification)
skills/                   Packaged .skill zips of the above, for distribution
```

## When to drill into a scoped skill instead of this one
Use `uc01`–`uc04` for a specific use case's flow/guardrails/endpoints. Use `platform-foundations` for ADR012–020 infrastructure decisions not tied to one use case. Use `ai-governance-verification` for the deploy gate/override mechanics in depth. Come back here when the question spans more than one of those, or is about the system as a whole.
