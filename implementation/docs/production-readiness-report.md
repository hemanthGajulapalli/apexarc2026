# Production Readiness Report

Status: **Ready for a staged rollout pilot. Not ready for estate-wide production traffic without the gaps below closed.** This is a deliberately calibrated verdict, not a rubber stamp — see the Roadmap's own phased-rollout philosophy (`README.md`), which this assessment follows rather than overrides.

## Go/no-go by area

| Area | Status | Evidence |
|---|---|---|
| Database schema | ✅ Ready | 26 tables, real PostgreSQL DDL, applied cleanly, seeded with realistic data matching every wireframe. See [database-schema.md](database-schema.md). |
| Core guardrails (human-in-the-loop, deploy gate) | ✅ Ready | Server-enforced, not UI convention. 46/46 automated tests + 9/9 real browser E2E test, both passing. See [test-strategy.md](test-strategy.md). |
| REST API surface | ✅ Ready for the modeled services | 6 services, ~30 endpoints, consistent error shape, RBAC enforced per-route. See [api-contracts.md](api-contracts.md). |
| Webapp UX | 🟡 Pilot-ready | 5 pages, real API integration, loading/empty/error states, busy-button double-submit guards. Not yet accessibility-audited or mobile-tested. |
| Authentication | 🔴 Not production-ready | Explicitly a documented stand-in for real OAuth/OIDC (ADR016). Must be swapped before any real visitor or staff account touches this system. |
| Object storage (piranha captures) | 🔴 Not implemented | Schema has the column (`capture_object_key`); no actual upload endpoint or S3-compatible integration exists yet. |
| Hardware/device integration | 🔴 Not implemented | Ingestion endpoints accept the *shape* real LoRaWAN gateway events would send; no actual MQTT broker, gateway concentrator, or device provisioning exists. |
| Load/performance | ⚪ Not assessed | No load test run against the 15,000-visitors/day target. `other_design_docs/fitness-functions.md` names this as required before scale-up. |
| Security review | ⚪ Not assessed | No dependency vulnerability scan, no penetration test. Standard pre-production gate not yet run. |
| Observability | ⚪ Not implemented | ADR017 calls for a shared logs/metrics/traces stack with correlation IDs from day one; this build has neither yet. |

Legend: ✅ verified and ready · 🟡 works, has known gaps · 🔴 explicitly not ready, documented why · ⚪ out of scope for this pass, not evaluated

## What "ready" actually means here, precisely

Every claim in the ✅ rows above is backed by something you can re-run yourself, not an assertion:

```bash
# Database — apply from scratch, watch it succeed with zero errors
psql -d von_digitalis -f implementation/db/schema.sql
psql -d von_digitalis -f implementation/db/seed.sql

# API + guardrails — 46 real tests against a real Postgres-backed app
cd implementation/server && npm test

# Full browser E2E — sign-in through a real override, verified after reload
cd implementation/server && npm start &
npm run e2e
```

The three real bugs this build's own test suite caught before you'd ever see them (timezone bug in the forecast baseline, a swapped-argument bug that silently notified staff on every low-confidence alert, and a test-fixture collision) are documented in [test-strategy.md](test-strategy.md) precisely because "we wrote tests" is a weaker claim than "here are the specific defects those tests actually found and the fixes that closed them."

## The core guardrail claim, stated precisely

The single most load-bearing claim in this whole submission is: **no AI-driven action reaches a consequential state without an attributed human decision, and this is enforced by the server, not the UI.** Concretely, verified:

- An alert cannot be confirmed or dismissed without a keeper's note (`POST /animal-health/alerts/:id/{confirm,dismiss}` → 400 without one).
- A treatment cannot be proposed before its alert is confirmed (409 otherwise).
- A staffing/investment recommendation cannot be approved without a note, and a `blocked` one cannot be approved at all, regardless of note (409).
- A model whose golden-set run failed cannot be promoted to production — full stop — except through a separate, justified, attributed override endpoint that itself requires non-empty text and is logged as a `fail`-result deploy, never disguised as a clean pass.

Each of these is proven by a dedicated automated test that asserts the *rejection*, not just the happy path — the harder and more important half of guardrail testing.

## Gaps that block full estate-wide production (explicit, prioritized)

1. **Real OAuth/OIDC** (ADR016) — replace `middleware/auth.js`'s base64-token stand-in with the cloud platform's managed identity service. This is the single highest-priority item; everything else in the system trusts `req.user` completely.
2. **Object storage integration** (ADR014, UC03) — piranha capture photos/video need a real S3-compatible upload path; the schema and API already have the seam (`capture_object_key`).
3. **Real MQTT/LoRaWAN ingestion** (ADR001) — the ingestion endpoints model the right *shape* but there is no real device fleet, gateway concentrator, or MQTT broker behind them yet. This is expected at this stage — hardware procurement and the RF survey (ADR001's own advice) haven't happened.
4. **Load testing against the growth target** — nothing here has been exercised at 15,000-visitors/day scale.
5. **Observability** (ADR017) — no correlation IDs, no centralized logs/metrics/traces yet. ADR017's own advice is to build this in from day one specifically because retrofitting it later into an event-driven system is materially harder — this is worth prioritizing early in the next phase, not deferring casually.
6. **Security review** — dependency scanning and a penetration test before any real visitor or payment data touches this system.

## What this build demonstrates that the wireframes alone could not

The wireframes (this repo's `wireframes/` folder) proved the *interaction design* — what a keeper sees when reviewing an alert, what an admin sees when a model deploy is blocked. This build proves those interactions are backed by **real, enforceable rules**: a keeper genuinely cannot skip the note field (the server rejects it), a blocked model genuinely cannot reach production without an override (the server rejects the promote call), and both of those rejections are covered by tests that fail loudly if a future change accidentally weakens them. That gap — between "the UI shows a guardrail" and "the guardrail cannot be bypassed" — is exactly what a production-readiness assessment has to distinguish, and this report is the artifact that makes the distinction explicit rather than assumed.

## Recommendation

Proceed with **Phase 0/1 pilot** exactly as `other_design_docs/roll-out-strategy.md` already describes (one zone, one enclosure cluster, real RF survey before hardware commitment) using this codebase as the real backend, with real OAuth swapped in first. Do not point real visitor traffic or real payment flows at this build until gap #1 above is closed — everything else can reasonably be hardened in parallel with a pilot, per the same phased/gated philosophy already adopted across every ADR in this project.
