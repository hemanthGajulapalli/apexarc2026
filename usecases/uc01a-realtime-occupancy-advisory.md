# UC01.a - Real-Time Occupancy & Area Advisory (Extended Case — Horizon: 3–6 months)

> Extended case of [UC01](uc01-visitor-popularity-analytics.md).
> Planned now (this document + ADR023); implementation comes in the
> 3–6 month horizon. No fundamental architecture change required.

## Overview
Operations staff and visitors need to know **which areas are full and
which are free, now** — not an hour ago. UC01's hourly aggregation is
sized for staffing/investment decisions, but a "full/free" indicator
that is an hour stale would mislead the people acting on it. This
extended case adds zone-level occupancy detection via LoRaWAN
occupancy counters, riding the estate's existing gateway infrastructure,
and surfaces live full/free status to ops staff (and later, per
ADR025, to visitor-facing clients such as the AR wayfinding app).
It also covers **people-hotspot alerts**: when occupancy in a zone
crosses congestion thresholds, an alert is raised to operations —
with the estate's standard human-in-the-loop confirmation before any
crowd-management action (rerouting, temporary closure) is taken.

## Actor(s)
- **Primary:** Operations staff (congestion monitoring, crowd-management
  decisions), visitors (consumers of full/free advisory)
- **Secondary:** Zone gateways/LoRaWAN counters (data source), the
  Countess (congestion trends inform capacity investment)

## Goal
Give a trustworthy, minutes-fresh answer to "which areas are full,
which are free, and where is congestion building" — and make sure a
human approves any response to it.

## Trigger
A LoRaWAN occupancy counter transmits its periodic count uplink (every
6–7 s, ADR023), or computed occupancy crosses a zone's congestion
threshold.

## Preconditions
- LoRaWAN occupancy counters deployed at zone entry/exit points and
  registered on the estate's gateway infrastructure (ADR001/ADR023).
- Duty-cycle compliance for the 6–7 s periodic uplink validated per
  ETSI EN 300 220 / FCC Part 15 (ADR023).
- Zone capacity values configured (`zones.capacity` in the existing
  schema).
- ADR004 recorded as a bounded exception for this surface only —
  hourly/daily analytics aggregation continues unchanged.

## Main Flow
1. Counters at a zone's entry/exit uplink compact counts every 6–7 s
   through the zone gateway → MQTT → ingestion (ADR001/ADR023).
2. The ingestion/popularity path maintains a **rolling occupancy
   state** per zone (last counts + entry/exit deltas) — incremental
   state, not stream processing.
3. Occupancy vs. `zones.capacity` yields per-zone status: free /
   busy / full — surfaced on the Ops Dashboard and, later, via the
   versioned client API (ADR025) to visitor-facing apps.
4. When a zone crosses its congestion threshold, a **hotspot alert**
   is raised to operations with tiered severity (ADR007): low
   confidence/log-only vs. high confidence/notify.
5. Any crowd-management action (staff dispatch, rerouting, temporary
   closure) requires explicit human confirmation in the same
   recommend-then-approve pattern as UC01's Ops AI recommendations.

## AI Involvement
Deliberately minimal at launch: occupancy computation is deterministic
counting. AI enters later — congestion *prediction* ("this zone fills
by 13:00") reuses the UC01/ADR021 forecasting models with occupancy as
an additional input, and would then go through golden-set verification
(ADR011) before its output reaches any advisory surface. Hotspot alert
tiering reuses the ADR007 alert machinery from UC02 rather than
inventing a new one.

## Alternate / Exception Flows
- **Counter failure / stale zone:** a zone with no uplinks inside a
  freshness window shows "unknown," never a stale "free" — a wrong
  full/free indicator is worse than none (the ADR004 Option 3 lesson).
- **Gateway buffering:** store-and-forward (ADR001) delays counts;
  occupancy carries a last-updated timestamp so consumers see freshness.
- **Duty-cycle pressure:** if counter density or payload growth
  threatens the ETSI/FCC budget, cadence/payload is re-validated
  before deployment (ADR023 advice).
- **Threshold mis-set for a zone:** human dismisses/adjusts; the
  feedback becomes tuning data, mirroring UC02's confirm/dismiss loop.

## Related ADRs
- **ADR023** — LoRaWAN Occupancy Counters & Duty-Cycled Periodic Uplink
- **ADR004** — Real-Time vs. Batch Analytics (bounded exception)
- **ADR001** — MQTT Ingestion Architecture for Patchy WiFi
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR021** — Popularity Forecasting & Recommendations
- **ADR025** — Estate API Surface for Mobile/AR Clients & MCP

## Success Metrics
- Zone occupancy status freshness within one uplink period under
  normal gateway conditions.
- Every crowd-management action traceable to a human approval.
- Zero duty-cycle compliance incidents across all counters.
- Reduction in congestion-related guest complaints vs. pre-advisory baseline.

## See Also
- [UC01 - Visitor Popularity Analytics](uc01-visitor-popularity-analytics.md)
- [Extended Use Cases Index](extended-uc-index.md)
