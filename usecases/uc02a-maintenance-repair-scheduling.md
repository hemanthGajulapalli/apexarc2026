# UC02.a - Maintenance & Repair Scheduling, Sync-to-Site, Availability Feed (Extended Case — Horizon: 3–6 months)

> Extended case of [UC02](uc02-animal-health-feeding-monitoring.md)
> (estate assets: rides, enclosures, grounds infrastructure — and the
> monitoring mindset extended from animals to assets).
> Planned now; implementation in the 3–6 month horizon.

## Overview
The estate runs 40 historic rides and 55 enclosures on a small staff.
Today maintenance lives in spreadsheets and memory; a broken ride is
discovered by a visitor or a keeper. This extended case adds an
**asset maintenance & repair registry**: scheduled maintenance plans,
repair tickets, and — critically — the connection between asset state
and the rest of the estate:

1. **Sync-to-site:** maintenance/repair schedules pushed to site teams
   (who's working where, when).
2. **Availability feed to ticketing SaaS:** when an asset is down for
   repair or scheduled maintenance, the ticketing SaaS (ADR009) and
   every visitor-facing surface reflect "not available" — so no
   visitor buys into, or queues for, an unavailable ride.
3. **Health-signal linkage:** UC02's animal-monitoring signals (and
   UC01.a occupancy) correlate with asset state — e.g. an enclosure
   sensor anomaly may indicate equipment (feeder, gate, filtration)
   failure, and a ride under repair is excluded from popularity-based
   staffing recommendations.

## Actor(s)
- **Primary:** Maintenance/site teams (work orders), operations staff
  (availability oversight)
- **Secondary:** Visitors (accurate availability), ticketing SaaS
  (availability feed consumer)

## Goal
No asset failure is discovered by a visitor; no visitor buys access to
an unavailable attraction; maintenance work is scheduled and visible
rather than reactive.

## Trigger
A scheduled maintenance date approaching, a repair ticket being
raised, or a monitoring signal (UC02 alert, UC01.a hotspot) suggesting
asset trouble.

## Preconditions
- Asset inventory registered (rides, enclosures, key infrastructure)
  with maintenance plans — a data-migration prerequisite, not an
  architecture change.
- Ticketing SaaS integration (ADR009) supports availability
  updates — contract item to confirm with the vendor.

## Main Flow
1. Planned maintenance is scheduled per asset (regulatory/historic-
   building inspection cycles, manufacturer service intervals, seasonal
   prep) — the schedule is the estate's source of truth.
2. Failures/defects raise **repair tickets**, from any source: staff
   report, UC02 sensor anomaly on enclosure equipment, or manual
   discovery.
3. **Sync-to-site:** work orders reach site teams with location,
   priority, and parts; completion closes the ticket with notes.
4. Assets marked out-of-service (repair or scheduled downtime)
   publish to the **availability feed**: ticketing SaaS (ADR009),
   Ops Dashboard, webapp, and — later — the ADR025 client API for the
   AR app and concierge grounding.
5. Popularity analytics and staffing recommendations exclude
   out-of-service assets automatically, so UC01's Ops AI never
   staffs or recommends around a closed ride.
6. Recurring patterns (repeat failures, aging assets) feed UC01.c
   decision support for replacement/investment cases.

## AI Involvement
Deliberately light at launch: scheduling and tickets are deterministic
workflow. Predictive maintenance (failure prediction from sensor
trends) is a named future extension — it would be a golden-set-gated
model per ADR011 consuming UC02's existing sensor telemetry, and
recommend-then-approve per ADR007 before taking an asset offline.

## Alternate / Exception Flows
- **Sudden failure mid-day:** emergency repair flow marks the asset
  unavailable immediately; the availability feed propagates before the
  next ticketing sync, and already-sold affected visits are flagged for
  the UC04.d refund policy.
- **Ticketing SaaS unavailable:** the estate's availability feed
  remains authoritative; SaaS catches up on reconnect (ADR009 thin-
  layer buffering posture).
- **Disputed completion:** reopening a ticket re-marks the asset
  unavailable; the audit trail records who closed and who reopened.

## Related ADRs
- **ADR009** — Ticketing Family-Pass Architecture (availability feed)
- **ADR001** — MQTT Ingestion (sensor-derived failure signals)
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR014** — Data Storage Strategy
- **ADR020** — CI/CD & Model Deployment (when predictive maintenance lands)

## Success Metrics
- % of asset downtime discoverable from estate systems before a
  visitor reports it.
- Zero ticket sales for unavailable assets (availability-feed audit).
- Mean time from failure signal to repair ticket.

## See Also
- [UC02 - Animal Health & Feeding Monitoring](uc02-animal-health-feeding-monitoring.md)
- [UC04.d - Dynamic Pricing & Pre-Exit Refunds](uc04d-dynamic-pricing-refunds.md)
- [Extended Use Cases Index](extended-uc-index.md)
