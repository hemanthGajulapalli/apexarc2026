# Architecture Characteristics

## Purpose

This document names the "-ilities" the Von Digitalis Estates
architecture is explicitly designed around, ranks their relative
priority, and explains where the AI-driven additions preserve, extend,
or deliberately raise the bar set by the base (pre-AI) system. This is
a direct response to one of the judging criteria: *do the
architectural characteristics of the additions match the existing
architecture?*

![Architectural characteristics comparison table showing base system priority vs. AI addition alignment across Reliability, Availability, Cost Efficiency, Auditability, Elasticity, and Adaptability](assets/existing-architectural-characteristics.svg)

## Priority Ranking

Not every characteristic can be maximized simultaneously — trade-offs
were made explicitly throughout the ADRs. In relative priority order
for this solution:

1. **Reliability** — payment/ticketing must not fail; animal welfare
   alerts must reach a keeper.
2. **Availability under patchy WiFi** — the estate's defining
   technical constraint; nearly every ADR in the ingestion/inference
   layer answers to this.
3. **Cost Efficiency** — the estate's stated business reality (see
   [Cost Analysis](cost-analysis.md)); over-engineering any single
   feature isn't affordable.
4. **Auditability** — increasingly important as AI-driven decisions
   affect animal welfare and business outcomes.
5. **Elasticity** — needed to support 3x visitor growth, but on a
   multi-year timeline, not a same-day spike requirement.
6. **Adaptability** — lower urgency today, but deliberately invested
   in for AI provider risk specifically (see below).

## Characteristic-by-Characteristic Detail

### Reliability
**Base system priority:** High — ticketing/payments is the estate's
revenue line and cannot silently fail.
**How AI additions match it:** Every AI output that could affect a
consequential outcome (an animal-welfare action, a business decision)
passes through mandatory human confirmation before anything happens
(ADR007). This means an unreliable or wrong AI output degrades to "an
alert someone dismisses," not "an automated failure" — matching the
base system's zero-tolerance posture for silent failure, just through
a different mechanism (human-in-the-loop rather than transactional
guarantees).

### Availability (under patchy WiFi)
**Base system priority:** High — the estate's core technical
constraint applies to every component, AI or not.
**How AI additions match it:** The edge/cloud inference split (ADR002)
means the most time-critical AI feature (animal-health threshold
alerting) works identically whether a zone is connected or not. This
is a direct extension of the same store-and-forward design used for
non-AI ingestion (ADR001) — the AI layer didn't get a weaker
availability bar than the rest of the system.

### Cost Efficiency
**Base system priority:** High — explicitly stated in the brief as an
existential concern for the estate.
**How AI additions match it:** Every AI-related ADR chose the
lower-cost, "good enough" option over the most sophisticated one
available — species-tiered monitoring over bespoke-per-enclosure
(ADR005), periodic sampling over continuous underwater CV (ADR006),
open models over commercial-only where feasible (ADR010). See
[Cost Analysis](cost-analysis.md) for the full breakdown.

### Auditability
**Base system priority:** Moderate — mainly driven by financial
record-keeping needs for ticketing.
**How AI additions extend it:** This is the one characteristic the AI
additions deliberately raise beyond the base system's original bar.
Golden-set regression results, drift-monitoring history, and every
keeper feedback label (ADR011) together create a decision trail for
AI-driven actions that's arguably more rigorous than what existed for
the base system's simpler logic — because non-deterministic outputs
need that extra evidence trail to be trustworthy at all.

### Elasticity
**Base system priority:** Moderate — growth is a 3-year goal, not a
sudden-spike requirement.
**How AI additions match it:** Serverless/managed cloud compute
(ADR013) scales cost and capacity with actual visitor and sensor
volume. AI inference workloads scale the same way as the rest of the
platform — no AI-specific capacity planning was introduced that
diverges from the base system's approach.

### Adaptability
**Base system priority:** Historically low — the estate has been
slow-changing for generations.
**How AI additions intentionally raise it:** This is the other
characteristic where the AI layer sets a higher bar than the base
system, on purpose. The model/provider abstraction layer (ADR010)
exists specifically because AI technology and pricing are changing
fast, in a way the rest of the estate's operations are not. This is a
deliberate, scoped exception, not an inconsistency — see the judges'
explicit question about handling provider price changes or shutdowns.

## Where the AI Additions Deliberately Diverge (and Why That's Correct)

Two characteristics — **Auditability** and **Adaptability** — are
intentionally elevated above the base system's original bar. This
isn't architectural drift; it's a direct, reasoned response to what's
different about the thing being added:

- Non-deterministic components need more evidence to trust than
  deterministic ones, hence higher auditability investment (ADR011).
- A fast-moving vendor landscape needs more insulation than a
  slow-moving estate, hence higher adaptability investment via the
  abstraction layer (ADR010).

Every other characteristic — reliability, availability, cost
efficiency, elasticity — is designed to match, not exceed or fall
short of, the base system's existing priority level.

## Related Documents
- [Fitness Functions](fitness-functions.md) — how these characteristics
  are continuously verified, not just asserted here.
- [Cost Analysis](cost-analysis.md)
- [Roll-Out Strategy](roll-out-strategy.md)
