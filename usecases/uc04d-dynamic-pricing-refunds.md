# UC04.d - Dynamic Pricing, AI-Recommended Discounts & Pre-Exit Refunds (Extended Case — Horizon: 6–12 months)

> Extended case of
> [UC04](uc04-returning-visitor-personalization.md).
> Planned now; implementation in the 6–12 month horizon. Governed by
> **ADR027**: AI recommends, humans approve — the estate does not run
> autonomous pricing; refunds are deterministic policy, not AI.

## Overview
The growth target (5,000 → 15,000 visitors/day) needs demand shaping,
not just demand capture: soft weekdays could carry discounts,
forecast-surge days protect revenue, and UC04's Phase Two
personalization can target offers at the visitors most likely to
return. This extended case adds **AI-recommended, human-approved
dynamic pricing and discounts** — operating inside pre-approved policy
bands — and a **refund flow for tickets purchased but unused before
exit**. It is deliberately the most governance-contested extended
case: pricing is a public-facing money path, so ADR027 fences
autonomy off explicitly (recommend-then-approve per ADR007), and
refunds stay entirely rules-based.

## Actor(s)
- **Primary:** Operations/pricing staff (approving recommendations),
  visitors (discount and refund consumers)
- **Secondary:** Ticketing SaaS (ADR009 — executes checkout at staged
  prices), UC01/ADR021 forecasting (demand signal), UC04 personalization
  (offer targeting)

## Goal
Smooth demand across days and zones with governed, banded discounts;
protect revenue on forecast-busy days; refund unused visits honestly
and automatically within published policy.

## Trigger
The pricing recommendation cycle (forecast-aware, e.g. daily/weekly
per ADR021 cadence), a visitor requesting a refund, or an
unused-ticket scan-window expiring post-visit-day.

## Preconditions
- UC01/ADR021 demand forecasting operational (the recommendation
  input).
- Policy bands published internally (e.g. "discounts up to 15% on
  forecast-soft weekdays") — the model's operating envelope.
- Ticketing SaaS (ADR009) supports staged price/offer sync — contract
  item to confirm.
- Refund policy published on the ticket at purchase (ADR027 advice —
  a refund engine is only defensible if disclosed up front).
- ADR011 golden-set coverage for the pricing model (historical demand
  vs. actual revenue outcomes) before any band widening.

## Main Flow
1. The pricing model produces **recommendations**: price adjustments
   or discounts per day/zone/ticket-class, grounded in UC01 forecasts,
   UC01.a occupancy history, seasonality, and (Phase Two) UC04
   personalization segments.
2. Recommendations enter the existing approve flow (ADR021 pattern):
   pricing staff approve, adjust, or reject — attribution in the
   audit trail. Within-band recommendations can be pre-authorized by
   policy; anything outside a band always needs explicit approval.
3. Approved prices/offers **stage in the estate's thin ticketing
   layer (ADR009)** and sync to the SaaS, which remains the checkout
   executor; the estate layer stays the single staging point.
4. **Refund flow (deterministic):** after a ticket's visit-day, an
   unscanned (unused) ticket is auto-flagged; refunds within the
   published policy execute automatically; ambiguous cases (partial
   use, multi-day pass questions, disputes) route to human review —
   no AI in the money decision.
5. UC02.a availability events interact here: assets going down
   mid-day flag affected sold visits for the refund policy.
6. Outcomes (revenue, uptake, refund rates) feed the pricing model's
   golden-set evaluation per ADR011 before any widening of bands or
   autonomy is even discussed.

## AI Involvement
Discount/pricing recommendations only — never execution without
approval, never refunds. The model is golden-set-governed (ADR011)
against realized revenue outcomes, drift-monitored as visitor mix
shifts, and provider-portable (ADR010). Personalization-driven offer
targeting inherits UC04 Phase Two's consent machinery (ADR018). If
the business ever wants **autonomous pricing**, ADR027 records that
as a fundamental policy change requiring a new ADR — flagged for
deliberate discussion, not silent accretion.

## Alternate / Exception Flows
- **Model recommends outside bands:** requires (and is flagged for)
  explicit human approval — bands are a governance boundary, not a
  suggestion.
- **Forecast bust (model expected soft, day ran busy):** approved
  discounts stand for the day — visitors are never repriced mid-visit;
  the outcome becomes golden-set data.
- **Refund dispute:** escalates to human review with the full
  scan/telemetry record; policy disclosure at purchase is the arbiter.
- **SaaS sync failure:** staged prices hold in the estate layer;
  checkout falls back to last-synced published prices rather than
  unapproved ones; divergence is alerted to pricing staff.

## Related ADRs
- **ADR027** — Dynamic Pricing, Discounts & Pre-Exit Refunds
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR009** — Ticketing Family-Pass Architecture
- **ADR021** — Popularity Forecasting & Recommendations
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR018** — Visitor Data Privacy & Governance

## Success Metrics
- Occupancy/revenue smoothing on discount days (variance reduction
  vs. baseline) at stable or improved total revenue.
- 100% of executed price changes traceable to an approval (policy
  pre-authorization or explicit).
- Refund policy execution: automatic within policy, zero
  AI-involved refund decisions, dispute rate trending down.
- Golden-set revenue-outcome accuracy before each band widening.

## See Also
- [UC04 - Returning Visitor Personalization](uc04-returning-visitor-personalization.md)
- [UC02.a - Maintenance & Repair Scheduling](uc02a-maintenance-repair-scheduling.md)
- [Extended Use Cases Index](extended-uc-index.md)
