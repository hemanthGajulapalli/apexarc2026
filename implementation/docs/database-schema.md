# Database Schema

Source of truth: [`implementation/db/schema.sql`](../db/schema.sql). Target engine: PostgreSQL 14+. This document explains the *why* behind the schema; read the SQL file for the exact DDL.

## ADR014 storage-strategy mapping

ADR014 calls for three purpose-fit storage technologies. Only the first is a SQL concern:

| Storage type | Production technology | This schema |
|---|---|---|
| Relational | Managed PostgreSQL (ADR013) | All tables below, in full |
| Time-series | Dedicated TSDB (TimescaleDB/InfluxDB) | Modeled as regular Postgres tables with time-bucketed indexes — see "Time-series domain" below. Same shape either way; only the storage engine differs in production. |
| Object storage | S3-compatible bucket | Not a SQL concern — `population_counts.capture_object_key` stores the reference key; see `implementation/server/src/services/animal-monitoring` for the local-filesystem stand-in. |

## Entity groups

### Identity & Access (ADR016)
- **`users`** — both visitor and staff identities, unified on one table (`kind` discriminates). OAuth provider/subject columns exist so identity stays decoupled from the ticketing SaaS (ADR009) — a ticket purchase references `users.id`, never anything ticketing-vendor-specific.
- **`staff_assignments`** — RBAC. A user can hold more than one role (composite unique on `user_id, role`), but ADR016's advice is to keep the role list to exactly Keeper/Operations/Admin.

### Estate topology
- **`zones`** — rides and enclosures share one table (`zone_type` discriminates) since both are popularity-tracking targets (UC01). `ble_equipped` records ADR003's decision that BLE presence sensing is deployed in only a small subset of zones — every zone still gets the ticket-scan baseline signal.
- **`enclosures`** — a 1:1 extension of `zones` for animal-specific attributes (`species_tier` per ADR005).

### Ticketing & Loyalty (ADR008/ADR009)
- **`tickets`** / **`ticket_entries`** — a ticket can cover multiple people (family pass); `ticket_entries` attributes each individual zone entry back to its own zone, so group purchases don't understate a zone's popularity (a UC01 alternate-flow requirement).
- **`loyalty_accounts`** — one per visitor. `personalization_opt_in` defaults `true` (opt-out model per ADR018) and directly gates the `/api/personalization/offers` endpoint.

### Time-series domain (ADR001/003/004/014)
- **`popularity_events`** — raw ticket-scan/BLE events. `buffered` preserves ADR001's store-and-forward semantics: `true` means the event was delayed by a gateway outage and delivered late, not that it "just happened."
- **`popularity_aggregates_hourly`** / **`popularity_aggregates_daily`** — ADR004's two cadences, computed by `rollupHourly`/`rollupDaily` in `services/popularity-analytics/aggregation.js`, not stored ad hoc.
- **`sensor_readings`** — animal-monitoring telemetry (activity, weight, water temp), same buffering semantics as popularity events.

### Forecasting & Recommendations (ADR021)
- **`popularity_forecasts`** — a forecast is a first-class row, not a transient API response, so its basis is auditable after the fact.
- **`recommendations`** — `status` is `pending | approved | blocked`. A blocked recommendation (e.g. stale zone data) cannot transition to `approved` — enforced in the API layer (`popularity-analytics/routes.js`), not just hidden in the UI.

### Animal Health & Feeding (ADR002/005/007) + Population Counting (ADR006)
- **`alerts`** — `origin` distinguishes `edge_threshold` (ADR002's local rule-based path, always `critical`, no model) from `cloud_model` (confidence-tiered per ADR007). `resolved_by`/`resolution_note` are NOT NULL-equivalent in practice: the API refuses to resolve an alert without both — see `services/animal-monitoring/routes.js`'s `resolveAlert`.
- **`treatments`** — can only be created for an already-`confirmed` alert (enforced in code), matching ADR007's "confirm before any consequential action" rule.
- **`feeding_logs`** — keeper-entered, first-class model input (ADR005), not derived from sensors.
- **`population_counts`** — `review_status` starts `pending`; `manual_cross_check` is optional but present when a keeper takes one, matching UC03's "decision aid, not oracle" framing.

### Personalization & Concierge (ADR022, gated by ADR008)
- **`personalized_offers`** — `engaged`/`engaged_at` capture the click-through feedback loop ADR022 and ADR011 both call for.
- **`concierge_queries`** — every grounded Q&A exchange is logged with its `grounding` and `confidence`, so a low-confidence or ungrounded answer is auditable, not just ephemeral.

### AI Governance (ADR011/ADR020)
- **`models`** — `governing_adr` is a required column: every tracked model must cite the ADR that scopes it. This directly closes the gap found earlier in this project, where two production AI systems (Ops AI, Customer GenAI) were running with no ADR behind them.
- **`golden_set_runs`** / **`golden_set_category_results`** — a run's per-category breakdown, not just a pass/fail bit, so a blocked deploy has real evidence attached (the "test result analysis" screen in the AI Governance Console).
- **`deploy_log`** — every promotion, pass or fail, attributed to `promoted_by`. A `pass` result being promoted still requires a human review (ADR020's advice), not silent auto-deploy.
- **`deploy_overrides`** — the *only* path to production for a model whose latest run failed. `golden_set_score_at_override` freezes the score at override time, so the record can't be reinterpreted later if the model's live score changes.

### Cross-cutting
- **`audit_log`** — supplementary to the per-domain resolution columns above (e.g. `alerts.resolved_by`), used for unified cross-service reporting, not the sole record of truth.

## Constraints that encode architectural decisions

- `models(name, version)` is UNIQUE — two deploy attempts of the same version can't silently create two rows.
- Every foreign key to `users(id)` on an approval/resolution column is nullable only until resolved, then required by the API layer — the schema allows `NULL` (a pending state) but the route handlers never let a resolution complete without it.
- `zones.ble_equipped` existing as a boolean (not inferred from event history) means the ingestion layer can reject a `ble_presence` event for a non-BLE zone outright (`422 zone_not_ble_equipped`) — see `services/ingestion/routes.js`.
