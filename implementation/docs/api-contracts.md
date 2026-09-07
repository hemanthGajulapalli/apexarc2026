# REST API Contracts

Base URL: `http://localhost:4000/api` (local dev). All bodies are JSON. Auth: `Authorization: Bearer <token>` — see `implementation/server/src/middleware/auth.js` for what the token is standing in for (real OAuth/OIDC in production, per ADR016).

Every service below is a real Express router in `implementation/server/src/services/<name>/routes.js`, mounted as its own module in `app.js` — independently deployable per ADR012, currently run as one process (a modular monolith — see [module-service-map.md](module-service-map.md) for why that's the correct call, not a shortcut).

## Identity & Access (ADR016)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signin` | none | `{provider, email, displayName, kind}` → `{token, user}`. Upserts by email. |
| GET | `/auth/me` | any | Current user + `staffRoles`. |
| GET | `/staff` | Admin | List all staff assignments. |
| POST | `/staff` | Admin | `{email, displayName?, role, scopeNote?}` → creates/updates a staff assignment. |

## Ticketing, Loyalty & Personalization (ADR008/009/018/022)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ticketing/purchase` | any | `{visitDate, adults, children, addOns[], promoCode?}` → ticket, computed server-side price. |
| GET | `/ticketing/loyalty` | any | The caller's own loyalty account. |
| PATCH | `/ticketing/loyalty/consent` | any | `{optIn: boolean}` — ADR018 opt-out toggle. |
| GET | `/personalization/offers` | any | **403** `personalization_opted_out` if consent is off. Otherwise a grounded offer generated from the visitor's real ticket-entry + popularity history. |
| POST | `/personalization/offers/:id/engage` | any | Marks an offer as clicked (feedback loop, ADR011/022). |
| POST | `/concierge/ask` | none | `{question}` → grounded answer + confidence. Never open-ended generation (ADR022). |

## Ingestion (ADR001)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ingestion/popularity-events` | none (device) | `{zoneId, source: ticket_scan\|ble_presence, occurredAt, buffered?}`. **422** if `ble_presence` on a non-BLE-equipped zone (ADR003 fallback). |
| POST | `/ingestion/sensor-readings` | none (device) | `{zoneId, metric, value, recordedAt, buffered?}`. |

## Popularity Analytics + Ops AI (ADR003/004/021)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/popularity/zones` | none | Zones ranked by latest hourly count. |
| GET | `/popularity/zones/:id` | none | Zone detail + last 24 hourly buckets. |
| POST | `/popularity/aggregate` | none | `{zoneId, hourBucket, dayBucket?}` — triggers a real rollup (production: scheduled job). |
| GET | `/popularity/forecast?zoneId=&for=` | none | Naive same-hour-last-week baseline forecast (ADR021's own advice: validate any model against this first). |
| GET | `/popularity/recommendations` | Operations/Admin | Staff-deploy + investment recommendations. |
| POST | `/popularity/recommendations/:id/approve` | Operations/Admin | `{note}` — **400** without a note, **409** if `blocked` or already `approved`. |

## Animal Monitoring (ADR002/005/006/007)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/animal-health/alerts` | none (system) | Creates an alert. `origin: edge_threshold` → always `critical`/`notified` (ADR002). `origin: cloud_model` → tiered by `confidence` (ADR007). |
| GET | `/animal-health/alerts` | Keeper/Operations/Admin | List all alerts. |
| POST | `/animal-health/alerts/:id/confirm` | Keeper | `{note}` — labels true-positive. **409** if already labeled. |
| POST | `/animal-health/alerts/:id/dismiss` | Keeper | `{note}` — labels false-positive. Same guardrail, symmetric endpoint (the fix for the gap found auditing the wireframes). |
| POST | `/animal-health/alerts/:id/treatment` | Keeper | `{plan, note}` — **409** unless the alert is already `confirmed`. |
| POST | `/animal-health/feeding-logs` | Keeper | `{zoneId, amountG, behaviorNotes?}`. |
| GET | `/animal-health/population/:zoneId` | none | Capture history for an enclosure. |
| POST | `/animal-health/population/:zoneId/capture` | Keeper | `{visionCount, confidence, modelId, captureObjectKey?}`. |
| POST | `/animal-health/population/:id/review` | Keeper | `{decision: confirmed_decline\|dismissed, note, manualCrossCheck?}` — **409** if already reviewed. |

## AI Governance (ADR011/020)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ai-governance/models` | Admin | Full registry. |
| GET | `/ai-governance/models/:id` | Admin | Model + latest golden-set run + per-category breakdown + drift history + deploy log + overrides. |
| POST | `/ai-governance/models/:id/golden-set-runs` | none (CI/CD) | `{overallScore, passed, categories[]}` — records a test run; sets model status to `candidate` or `blocked`. |
| POST | `/ai-governance/models/:id/promote` | Admin | **409** `golden_set_failed` if the latest run didn't pass — this is the actual hard gate (ADR020), not advisory. **409** `no_golden_set_run` if there's no run on record at all. |
| POST | `/ai-governance/models/:id/override` | Admin | `{justification}` — the *only* path to production for a blocked model. **400** without justification, **409** `not_blocked` if the model already passes (use `/promote` instead). |

## Error shape

Every error response is `{error: "<machine_code>", message: "<human sentence>"}`. Machine codes are stable and asserted directly in the test suite (`implementation/server/test/*.test.js`) — they are part of the contract, not incidental.

## What's real business logic vs. a documented stand-in

| Area | Status |
|---|---|
| Auth token | **Stand-in.** Base64 JSON, not signed. Production: real OAuth 2.0/OIDC (ADR016). Swapping this file is the entire migration path — no route handler changes. |
| Forecast | **Real naive baseline** ("same hour, 7 days ago"), not a placeholder string. ADR021's own advice says any real ML model must beat this baseline before being trusted — this endpoint IS that baseline. |
| Deploy gate / override | **Fully real**, server-enforced, covered by automated tests (see [test-strategy.md](test-strategy.md)). |
| Alert confirm/dismiss/treatment guardrails | **Fully real**, server-enforced. |
| Object storage for captures | **Stand-in** (a string key column, no actual file upload endpoint yet) — documented in the schema doc. |
| Vision/anomaly-detection models themselves | **Out of scope.** The API records and enforces decisions *about* models (golden-set, drift, deploy gate); it does not implement the ML models producing the underlying `visionCount`/`confidence` values — those are supplied by the caller, exactly as they would be by a real inference service in production. |
