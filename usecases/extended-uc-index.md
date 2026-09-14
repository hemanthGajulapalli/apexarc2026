# Extended Use Cases Index (UCxx.a …) — Planned Today, Implemented on Horizon

The estate's base architecture (UC01–UC04, ADR001–ADR022) was designed
to absorb future capabilities without fundamental change. This
program enumerates the business's 14 new/extended capabilities as
**sub-numbered extended cases** under their parent use cases, each
with an implementation horizon (3 / 6 / 12 / 24 months), plus the new
ADRs that record the (few) decisions these capabilities required.

**Deliverable posture:** planned today — these documents and their
ADRs exist; implementation arrives on the stated horizon. Nothing here
changes the architecture fundamentally; the genuinely contested points
are listed under [Fundamental changes considered](#fundamental-changes-considered).

## Traceability: business capability → extended case → ADRs → horizon

| # | Business capability | Extended case | Parent | Key ADRs | Horizon |
|---|---|---|---|---|---|
| 1 | Maintenance & repair | [UC02.a](uc02a-maintenance-repair-scheduling.md) | UC02 | ADR009, ADR014 | 3–6 mo |
| 2 | Real-time area full/free advisory | [UC01.a](uc01a-realtime-occupancy-advisory.md) | UC01 | **ADR023**, ADR004* | 3–6 mo |
| 3 | Maintenance/repair schedule sync + ticket SaaS availability · dynamic pricing (AI discounts) · unused pre-exit refunds | scheduling → [UC02.a](uc02a-maintenance-repair-scheduling.md) · pricing/refunds → [UC04.d](uc04d-dynamic-pricing-refunds.md) | UC02 / UC04 | **ADR027**, ADR009, ADR007 | 3–6 mo / 6–12 mo |
| 4 | AR wayfinding app (forked OSS, offline maps/hunts, telemetry) | [UC04.a](uc04a-ar-wayfinding-app.md) | UC04 | **ADR025**, ADR023, ADR018 | 24 mo |
| 5 | People-hotspot alerts, human-in-loop | [UC01.a](uc01a-realtime-occupancy-advisory.md) | UC01 | ADR007, ADR023 | 3–6 mo |
| 6 | LLM auto-generated guided tours (1/2/3-day, personalized) | [UC04.b](uc04b-guided-tour-itineraries.md) | UC04 | ADR022, ADR008, ADR011 | 12 mo |
| 7 | MCP endpoint / interest-based LLM planner | [UC04.c](uc04c-mcp-planner-endpoint.md) | UC04 | **ADR025**, ADR016, ADR018 | 12 mo |
| 8 | Flora + fauna: SOPs, governance, maintenance logs, seasonal/daily weather predictions | [UC02.b](uc02b-flora-husbandry-standards-logs.md) | UC02 | **ADR026**, ADR024, ADR007 | 6–12 mo |
| 9 | "What to see where" forecast by time/weather/season (future micro-climate stations) | [UC01.b](uc01b-weather-based-visibility-forecast.md) | UC01 | **ADR024**, ADR021, ADR011 | 12 mo |
| 10 | Commercial satellite feed subscription → flora/grounds AI analysis (nightly/day-spread jobs) | [UC02.c](uc02c-satellite-flora-monitoring.md) | UC02 | **ADR024**, ADR014, ADR010 | 24 mo |
| 11 | Animal husbandry standards | [UC02.b](uc02b-flora-husbandry-standards-logs.md) | UC02 | **ADR026**, ADR005 | 6–12 mo |
| 12 | Proactive AI alerts from public-domain notices (wind/snow closures etc.) | [UC02.d](uc02d-proactive-public-alert-scanning.md) | UC02 | **ADR024**, ADR007, ADR026 | 6–12 mo |
| 13 | Business decision support: stored estate data + public sentiment + behavior | [UC01.c](uc01c-business-decision-support.md) | UC01 | **ADR024**, ADR021, ADR018 | 12–24 mo |
| 14 | Regulatory/compliance LLM advisory on SOP + public-domain corpus, human-in-loop | [UC02.e](uc02e-compliance-advisory.md) | UC02 | **ADR026**, ADR007, ADR016 | 12 mo |

\* ADR004 remains ACCEPTED with a **bounded, named exception** recorded
in ADR023 (occupancy surface only); its hourly/daily batch default is
otherwise unchanged.

**New ADRs introduced by this program:**
[ADR023](../ADRs/adr023-lorawan-occupancy-counters-duty-cycled-uplink.md) ·
[ADR024](../ADRs/adr024-external-data-feed-ingestion.md) ·
[ADR025](../ADRs/adr025-mobile-ar-mcp-api-surface.md) ·
[ADR026](../ADRs/adr026-estate-knowledge-compliance-advisory.md) ·
[ADR027](../ADRs/adr027-dynamic-pricing-refunds.md)

## Why nothing here changes the fundamentals

The estate is cost-constrained — the whole architecture exists because
"put people everywhere" is unaffordable. Each extended case was
checked against the [module service map](../implementation/docs/module-service-map.md)
invariants; the results:

- **New inbound data classes** (occupancy counters, weather, public
  notices, satellite, visitor telemetry) are all batch or periodic —
  they land in the existing ingestion service per ADR001/ADR004/ADR024.
  No new service, no streaming infrastructure.
- **New outbound surfaces** (AR app, MCP planners) are read-oriented
  and governed by one versioned API (ADR025) — no new server tier.
- **New AI features** (advisory, forecasting, itineraries, pricing
  recommendations, sentiment synthesis) reuse the estate's two
  standing guardrails — human confirmation (ADR007) and golden-set
  verification (ADR011) — rather than inventing new governance.
- **The only near-real-time need** (occupancy) is served by the radio
  layer's legal, periodic duty-cycled uplinks (ADR023), not by
  infrastructure.

## Fundamental changes considered

Items that *would* have required a fundamental change, and how each
was resolved — recorded so the boundaries are explicit:

1. **Real-time occupancy vs. ADR004's batch decision** — *Resolved.*
   LoRaWAN occupancy counters report on 6–7 s periodic duty-cycled
   uplinks (compliant with ETSI EN 300 220 / FCC Part 15 duty-cycle
   law); rolling counters replace hourly aggregation for this one
   surface. Bounded exception named in ADR023; the batch default
   stands. If live queue-time displays ever land, ADR004's widening
   is a new decision, not an accretion.
2. **Mobile/AR client platform** — *Resolved.* New client tier, but
   the backend impact is one versioned read API (ADR025); the
   open-source fork target is deliberately undecided (future spike).
3. **External feeds (weather, public notices, satellite)** —
   *Resolved.* A new inbound data *class*, but the batch pull-job
   mechanism (ADR024) keeps it inside the existing ingestion service.
   Cost note: the satellite subscription (UC02.c) is the estate's
   first recurring external data purchase — cost-analysis doc must be
   updated before contracting.
4. **Dynamic pricing** — *Bounded, not resolved.* ADR027 admits
   AI-recommended, human-approved pricing within published bands and
   explicitly fences off autonomous pricing as a future fundamental
   policy change requiring its own ADR. This is the one item on this
   list the business may want to revisit — flagged deliberately.
5. **Refunds** — *Resolved as non-AI.* Deterministic published policy
   only; AI is excluded from the money-refund decision (ADR027).

## See Also
- [UC01](uc01-visitor-popularity-analytics.md) ·
  [UC02](uc02-animal-health-feeding-monitoring.md) ·
  [UC03](uc03-piranha-population-counting.md) ·
  [UC04](uc04-returning-visitor-personalization.md)
- [Roll-out strategy](../other_design_docs/roll-out-strategy.md) —
  horizon mapping into the Phase 0–3 framing
- [Module service map](../implementation/docs/module-service-map.md) —
  where each future capability lands in the monolith
- [Extended use cases map (diagram)](../assets/extended-use-cases-map.svg)
