# Cost Analysis

## Overview

Every major architecture decision in this solution was made with one
eye on cost — not because the estate is unwilling to invest, but
because the brief is explicit that profitability is the whole point:
if the estate doesn't become more profitable, "it's back to the garden
gnome business." This document lays out where the money goes, and —
more importantly — where deliberate design choices avoided spending it.

Figures below are relative/order-of-magnitude estimates for planning
purposes, not vendor quotes. Actual pricing should be confirmed during
procurement (see the advice notes in ADR013 and ADR009).

## Cost Categories

### 1. Hardware (one-time + replacement)
- Zone gateway devices (~1 per ride/enclosure cluster, ADR001) — the
  single largest hardware line item, but far cheaper than giving every
  individual sensor its own cloud-connectivity hardware (Option 2 in
  ADR001 was rejected specifically on cost grounds).
- Sensors (weight, motion, feeding-station triggers) — cheap,
  commodity-class hardware, reused across a species tier rather than
  bespoke per enclosure (ADR005).
- BLE presence sensors — deployed only in a small, targeted set of
  zones (ADR003), not estate-wide, keeping this line item small.
- No dedicated underwater camera system for the piranha enclosure —
  periodic photo/video capture uses existing keeper devices rather than
  permanent installed hardware (ADR006), avoiding a costly and
  high-maintenance camera build-out for a single enclosure.

### 2. Cloud Infrastructure (ongoing, usage-scaled)
- Single mainstream cloud provider, managed/serverless-first (ADR013)
  — avoids the duplicated cost of multi-cloud redundancy the estate's
  current scale doesn't need.
- Three purpose-fit storage systems (time-series, relational, object),
  each cost-optimized for its data shape rather than one system
  compromising on all three (ADR014).
- Compute scales with actual visitor/sensor volume via serverless
  patterns — costs grow with the business (toward the 15,000/day
  target) rather than being provisioned for peak capacity year-round.

### 3. SaaS & Vendor Costs (ongoing subscription)
- Ticketing platform subscription (ADR009) — a recurring cost, but
  cheaper over time than building and maintaining payment/PCI
  compliance in-house.
- AI model/provider costs — variable depending on which tasks use
  commercial frontier models vs. open/self-hostable models (ADR010).
  Lower-stakes tasks default to open models specifically to control
  this line item and reduce vendor lock-in risk simultaneously.

### 4. Engineering Effort (build cost)
- Concentrated on the features that differentiate the estate (AI
  monitoring, popularity analytics), not on well-solved problems
  (ticketing, authentication) that were deliberately bought rather
  than built (ADR009, ADR016).
- Phased rollout (see [Roll-Out Strategy](roll-out-strategy.md)) means
  engineering spend on animal monitoring is proven on 2-3 tiers before
  being committed across all 55 enclosures — avoiding a large upfront
  build that might need significant rework after real-world pilot
  feedback.

### 5. Operational Cost (staff time)
- Keeper time spent confirming/dismissing alerts (ADR007) — a real,
  ongoing cost, but one the tiered-alert design specifically minimizes
  by suppressing low-confidence noise rather than surfacing everything.
- Golden-set curation and periodic review — a recurring but bounded
  engineering/keeper time cost tied to each model deployment (ADR011,
  ADR020), not a per-transaction cost.

## Cost-Avoidance Decisions (Where Design Choices Saved Money)

| Decision | Cost avoided | ADR |
|---|---|---|
| Zone gateways instead of direct-to-cloud per sensor | Per-device cloud connectivity hardware and reliability logic at ~100+ endpoint scale | ADR001 |
| Reuse ticketing infrastructure for popularity signal | A dedicated sensor network across all 95 locations | ADR003 |
| Hourly/daily batch instead of streaming analytics | Streaming infrastructure that patchy WiFi would undermine anyway | ADR004 |
| Species-tiered monitoring instead of bespoke-per-enclosure | Custom sensor/model builds for 55 individual enclosures | ADR005 |
| Periodic sampling instead of continuous underwater CV | Permanent camera installation and maintenance for one enclosure type | ADR006 |
| Defer AI personalization to Phase Two | Building a personalization feature with no data to personalize against | ADR008 |
| Buy ticketing SaaS instead of building | PCI compliance and payment-security engineering effort | ADR009 |
| Model abstraction layer + open models where feasible | Full re-write cost if a commercial provider changes pricing or shuts down | ADR010 |
| Single cloud provider, managed-first | Multi-cloud operational overhead not justified at current scale | ADR013 |
| Delegate visitor/staff auth to existing platforms | Custom authentication build and its ongoing security liability | ADR016 |
| Shared observability stack (not a separate MLOps platform) | A second vendor relationship and toolset to maintain | ADR017, ADR020 |

## Cost vs. Risk Trade-offs Worth Tracking

A few decisions accept a higher ongoing cost in exchange for lower
risk, and are worth monitoring as the estate scales:

- **Per-device TLS certificates (ADR015)** cost more in provisioning
  time than shared credentials, but the estate accepted this because
  devices sit in a publicly accessible park — the security risk of the
  cheaper option was judged not worth the savings.
- **Tiered backup strategy (ADR019)** spends more on payment/reference
  data recovery than on telemetry, deliberately, because losing a
  ticket record is a different order of cost than losing an hour of
  sensor readings.

## Revisiting This Analysis

Cost assumptions should be revisited at each roll-out phase gate (see
[Roll-Out Strategy](roll-out-strategy.md)): actual cloud spend,
SaaS invoices, and hardware failure/replacement rates from Phase 0-2
should replace the estimates here once real data exists, particularly
before committing to the Phase 3 estate-wide expansion.

## Related Documents
- [Roll-Out Strategy](roll-out-strategy.md)
- [Architecture Characteristics](architecture-characteristics.md)
- [ADR Summary — Final Decisions & Advice](spikes/adr-summary-decisions-and-advice.md)
