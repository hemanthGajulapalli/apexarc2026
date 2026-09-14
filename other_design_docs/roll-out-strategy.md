# Roll-Out Strategy

## Overview

The Von Digitalis Estates solution is delivered in four phases, each
gated by pilot validation and staff sign-off before expanding further.
This staged approach reflects a deliberate choice made throughout the
architecture: prove a use case on a small, controlled slice of the
estate before committing budget and operational trust to it estate-wide
(see the "pilot before scaling" theme in the ADR summary).

![Rollout strategy diagram showing four phases: Foundations, Popularity Analytics, Animal Monitoring, and Scale & Personalize, each gated by pilot validation before expanding](../assets/rollout-strategy.svg)

## Why a Phased Approach

Two constraints shape this plan directly:

- **Data doesn't exist yet.** Several features (returning-visitor
  personalization, chief among them) can't be built meaningfully until
  there's a season of real ticketing and popularity data to learn
  from (ADR008). Building them earlier means building against
  assumptions instead of evidence.
- **Trust in AI outputs has to be earned incrementally.** Animal
  health/feeding monitoring and population counting both depend on
  keeper trust in the alerts they receive. Rolling out to all 55
  enclosures on day one, before thresholds are tuned against real
  behavior, risks alert fatigue that's hard to undo (ADR007's advice:
  collect a full season of labeled data before auto-tuning).

## Phase 0 — Foundations

**Goal:** Get the plumbing in place that every later phase depends on.

- Ticketing SaaS platform live, issuing tickets and family passes
  (ADR009); OAuth-based visitor and staff identity live on the cloud
  platform, linked to ticketing by account ID (ADR016).
- Site RF survey completed to validate the 3-gateway LoRaWAN layout,
  ahead of finalizing sensor/gateway procurement (ADR001).
- LoRaWAN sensor and gateway-concentrator MQTT ingestion infrastructure
  deployed across all rides and enclosures (ADR001).
- Shared observability stack stood up (ADR017).
- Simple, non-AI loyalty mechanism live at launch (ADR008 Phase One).

**Exit criteria:** Tickets can be purchased and scanned reliably;
visitors and staff can authenticate via OAuth; gateway data reaches the
cloud even through a simulated gateway backhaul outage; loyalty
enrollment is functioning.

## Phase 1 — Popularity Analytics

**Goal:** Give operations staff their first real visibility into which
attractions are busy.

- Ticket-gate scan data flows into hourly/daily aggregation (ADR003,
  ADR004).
- BLE presence sensing deployed in the initial small set of
  highest-value zones.
- Operations dashboard live, showing zone popularity and trend.

**Exit criteria:** Operations staff can identify the top/bottom 5
attractions within an hour of a shift starting (UC01's success
metric), and the initial BLE zone list is validated against real
usage before any expansion.

## Phase 2 — Animal Monitoring

**Goal:** Prove the animal health and population-counting approach on
a controlled subset before trusting it estate-wide.

- The 2-3 highest-value species tiers are piloted first (ADR005's
  advice), starting with the aquatic tier given the piranha
  population-tracking requirement.
- Local threshold alerting and cloud anomaly detection go live for
  piloted tiers (ADR002, ADR005).
- Jumping piranha population counting goes live (ADR006), validated
  against keeper manual counts over several sampling cycles before
  being trusted unsupervised.
- Alert-tiering and feedback loop operating, with false-positive
  tolerance tuned against real keeper feedback (ADR007).

**Exit criteria:** False-positive rate for piloted tiers is within the
tolerance keepers agreed to pre-launch; the piranha vision model's
count accuracy is validated against manual counts within an agreed
tolerance.

## Phase 3 — Scale & Personalize

**Goal:** Expand what Phase 2 proved works, and revisit the
personalization question now that real data exists.

- Species-tiered monitoring expanded from the pilot tiers to all 55
  enclosures.
- The Phase Two trigger for AI-driven returning-visitor
  personalization (UC04) is evaluated — has a full season of
  ticketing/popularity data been collected? If yes, personalization
  development begins, following the same golden-set/drift-monitoring
  approach used elsewhere (ADR011).

**Exit criteria:** All 55 enclosures reporting reliably; a go/no-go
decision made on Phase Two personalization based on data volume, not a
fixed calendar date.

## Cross-Phase Principles

- **No phase skips verification.** Every AI feature introduced in
  Phase 2 or Phase 3 goes through the same golden-set regression gate
  before deployment (ADR011, ADR020) — phasing controls *scope*, not
  *rigor*.
- **Expansion is triggered by evidence, not schedule.** Moving from a
  pilot tier to full rollout, or from Phase One to Phase Two
  personalization, is gated on meeting the stated exit criteria, not
  on a calendar date passing.
- **Each phase is independently valuable.** If the estate paused after
  any phase, what's shipped so far still delivers real value —
  ticketing and popularity analytics alone already address two of the
  three named business challenges in the brief.

## Extended Use Cases — Horizon Mapping

The extended use cases program ([index](../usecases/extended-uc-index.md))
maps 14 business capabilities onto this phasing. Horizons are planned
against the phase evidence-gates above, not instead of them:

| Horizon | Extended cases | Phase alignment |
|---|---|---|
| 3–6 mo | UC01.a real-time occupancy & hotspot alerts (ADR023); UC02.a maintenance/repair scheduling + availability feed | Late Phase 0 / Phase 1 — rides the ticketing + popularity foundations |
| 6–12 mo | UC04.d dynamic pricing & refunds (ADR027); UC02.b flora/husbandry standards & logs; UC02.d public-alert scanning | Phase 1 → Phase 2 — monitoring guardrail patterns extended to assets, flora, and public-domain feeds |
| 12 mo | UC01.b weather-aware visibility forecast; UC04.b guided-tour itineraries; UC04.c MCP planner; UC02.e compliance advisory | Phase 2 — needs a season of data (ADR008 gate) and the ADR024/ADR026 machinery landed first |
| 24 mo | UC04.a AR wayfinding app (forked OSS, needs ADR025 API + fork-target spike); UC02.c satellite flora monitoring (subscription costed first); UC01.c business decision support | Phase 3 — evaluated alongside the Phase Two personalization trigger |

The same cross-phase principles apply unchanged: no extended case
skips the golden-set/ADR007 guardrails when its AI parts land, and
each horizon gate is evidence-based.

## Related Documents
- [Extended Use Cases Index](../usecases/extended-uc-index.md)
- [Cost Analysis](cost-analysis.md) — must be updated before the
  satellite subscription (UC02.c) is contracted
- [Architecture Characteristics](architecture-characteristics.md)
- [Fitness Functions](fitness-functions.md)
- [ADR Summary — Final Decisions & Advice](../adviceforum/adr-summary-decisions-and-advice.md)
