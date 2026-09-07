---
name: uc01-visitor-popularity-analytics
description: Reference for UC01 (Visitor Popularity Analytics) in the Von Digitalis Estates project — ticket-scan/BLE popularity tracking, hourly/daily aggregation, and the "Ops AI" forecasting/recommendation engine. Use whenever working on popularity analytics, the Ops Dashboard, zone popularity, staffing/investment recommendations, or ADR001/ADR003/ADR004/ADR021, so this context doesn't need to be re-derived from the repo each time.
---

# UC01 — Visitor Popularity Analytics

Full use case: [`usecases/uc01-visitor-popularity-analytics.md`](../../../usecases/uc01-visitor-popularity-analytics.md) · test approach: [`usecases/uc01-test-approach.md`](../../../usecases/uc01-test-approach.md)

## Goal & actors
Give operations staff same-day staffing signal and the Countess longer-term investment signal from real visitor movement — no visibility into popularity previously existed. Primary actors: Operations/staffing team, the Countess. Secondary: visitors (indirect beneficiaries).

## Trigger & main flow
1. Visitor scans a ticket at a ride/enclosure entry (or, in BLE-equipped zones only, is detected via anonymized BLE presence).
2. Event flows through the local zone gateway (ADR001) to the ingestion service.
3. Popularity Analytics Service aggregates **hourly** (same-day staffing) and **daily** (investment trend) — ADR004.
4. Aggregates surface on the Ops Dashboard; operations staff act on them.

## Related ADRs (decisions only — read the full file for trade-off analysis)
- **ADR001** — Zone-based LoRaWAN gateways, store-and-forward, 3 concentrators for ~95 zones (patchy-WiFi resilience).
- **ADR003** — Ticket-gate scans are the baseline signal *everywhere*; BLE only in a small number of high-value zones (`zones.ble_equipped`). A non-BLE zone posting a `ble_presence` event is a **422**, not silently accepted — see Implementation below.
- **ADR004** — Hourly + daily batch aggregation. **No streaming infrastructure** — this is a deliberate, repeated architectural constraint. Any forecasting work must respect it (see ADR021).
- **ADR018** — BLE identifiers discarded immediately after aggregation into zone counts (privacy by data minimization).
- **ADR021** — *(Added after a gap found comparing the architecture to the wireframes — see [`ADR-Spikes/012-spike-popularity-forecasting-recommendations.md`](../../../ADR-Spikes/012-spike-popularity-forecasting-recommendations.md).)* "Ops AI": same-day demand forecasting + staff/investment recommendations, built **on top of** ADR004's existing hourly aggregates (not new streaming infra). Every recommendation requires human approval with a note (extends ADR007's guardrail from animal welfare to operational/financial decisions).

## Wireframe
`wireframes/ops-dashboard-wireframe.html` — three screens: `screen-overview` (KPIs, 24h popularity chart, ranked hot zones, alert strip), `screen-zone` (drill-down), `screen-decisions` (staff-deploy/investment recommendation cards, approval modal requiring identity + note). Real screenshots: `assets/ops-dashboard-overview.png`, `assets/ops-dashboard-decision-panel.png`.

## Real implementation (`implementation/`)
- **Service:** `server/src/services/popularity-analytics/{routes.js,aggregation.js}`.
- **DB tables:** `zones`, `popularity_events` (raw), `popularity_aggregates_hourly`/`_daily`, `popularity_forecasts`, `recommendations`.
- **Key endpoints:** `GET /popularity/zones`, `GET /popularity/zones/:id`, `POST /popularity/aggregate` (triggers a real rollup), `GET /popularity/forecast?zoneId=&for=` (naive same-hour-last-week baseline — ADR021's own advice says any real model must beat this before being trusted), `GET /popularity/recommendations` (Operations/Admin only), `POST /popularity/recommendations/:id/approve` (400 without a note, 409 if `blocked` or already approved).
- **Real webapp page:** `implementation/webapp/ops-dashboard.html`.
- **Tests:** `implementation/server/test/popularityAnalytics.test.js` — includes a regression test for a real bug this project's own suite caught: `naiveForecast` originally used `Date.setMinutes()` (local timezone) instead of `setUTCMinutes()`, silently shifting the hour-bucket lookup under IST. Fixed in `aggregation.js`.

## Success metrics (from the use case doc)
- Top/bottom 5 attractions identifiable within an hour of shift start.
- 100% zone coverage via ticket-gate baseline, even where BLE doesn't extend.
- No individual-level location data persists beyond aggregation.

## Known, documented gaps (don't re-discover these — they're already tracked)
- BLE-vs-ticket-only zone distinction isn't surfaced in the Ops Dashboard UI (backend-only nuance) — low priority, intentionally out of scope so far.
- Family-pass multi-entry attribution (`ticket_entries` table) exists in the schema but isn't visualized anywhere.
