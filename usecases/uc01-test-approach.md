# Test Approach — UC01: Visitor Popularity Analytics

## Overview
This use case is primarily a **deterministic data pipeline**
(scan/presence events → aggregation → dashboard), not a predictive AI
feature. The testing effort is therefore weighted toward conventional
testing, with a smaller AI-adjacent testing surface reserved for any
future trend-forecasting or anomaly-flagging built on top of the
aggregated data (noted as forward-looking, not part of the initial
build).

---

## Part A — Traditional / Deterministic Testing

### Unit Tests
- Ticket-gate scan event parsing and validation (malformed/partial
  events handled gracefully).
- BLE presence-count aggregation logic within a single zone.
- Zone gateway buffering and deduplication logic (ADR001) — a replayed
  event after reconnect must not double-count.
- Hourly and daily aggregation job logic (ADR004) — correct bucketing
  at hour/day boundaries, including timezone edge cases.
- Family-pass attribution logic — a multi-person pass should not
  under- or over-count entries.

### Integration & Contract Tests
- MQTT topic contract between zone gateways and the ingestion service
  (schema versioning, backward compatibility).
- Ticketing SaaS webhook contract (ADR009) — verify the integration
  layer handles the vendor's actual payload shape, including any
  vendor-side schema changes.
- Contract between the aggregation service and the time-series store
  (ADR014) — write/read shape consistency.

### End-to-End Tests
- Full journey: visitor scans at a gate → event flows through
  gateway → ingestion → aggregation → appears correctly on the ops
  dashboard within the expected batch window (ADR004).
- BLE-equipped zone: presence detected → aggregated into zone count →
  individual identifiers confirmed **not** persisted beyond aggregation
  (ADR018 privacy requirement, testable as a data-retention assertion).
- Family-pass purchase → multiple entries correctly attributed to one
  purchase across different zones.

### Non-Functional Tests
- **Load:** simulate concurrent scan events at the 15,000 visitors/day
  target across all ~95 locations, verify aggregation job completes
  within its expected batch window under load.
- **Resilience:** WiFi outage in a zone for 10/30/60 minutes — verify
  no data loss and correct deduplication on reconnect (ties directly to
  ADR001's spike validation).
- **Security:** BLE data cannot be traced back to an individual device
  once aggregated; verify via a targeted privacy test, not just a
  design review.

### Traditional Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| Event ingestion success rate | ≥ 99.9% of scan/presence events reach aggregation |
| Deduplication accuracy | 0% double-counted events after a simulated reconnect |
| Aggregation job completion time | Within the batch window (hourly/daily per ADR004) at peak load |
| Dashboard data latency | Matches the committed hourly/daily cadence, not "real-time" |
| Data loss during outage simulation | 0% — all buffered data delivered on reconnect |
| Individual-level data retention | 0 records beyond the aggregation step (privacy assertion) |
| Test coverage (unit + integration) | ≥ 80% on aggregation and gateway logic |

---

## Part B — AI-Adjacent Testing (Forward-Looking)

This use case has no predictive/ML model in the initial build. If a
future phase adds trend forecasting or automated staffing
recommendations on top of the aggregated popularity data, apply the
same AI verification approach as UC02 (golden-set regression, drift
monitoring, human feedback) before treating any such recommendation as
trustworthy. No AI-specific metrics apply until that phase is scoped.

---

## Acceptance Criteria (Definition of Done)
- Operations staff can identify the top/bottom 5 attractions by
  popularity within an hour of a shift starting.
- Popularity data is available for 100% of zones (ticket-gate baseline)
  even where BLE coverage doesn't extend.
- No individual-level visitor location data persists beyond
  aggregation.

## Test Data Requirements
- Synthetic scan-event generator capable of simulating peak-day volume
  (15,000/day) across all ~95 locations.
- A known "busy day" and "quiet day" reference dataset for spot-
  checking aggregation correctness against expected patterns.

## Related ADRs
ADR001, ADR003, ADR004, ADR009, ADR014, ADR018
