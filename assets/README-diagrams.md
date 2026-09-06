# Diagrams — Von Digitalis Estates

This file explains each diagram in `/diagrams`, what it shows, and which
ADRs/use cases it ties back to. All diagrams follow a consistent color
key unless noted otherwise:

- 🔵 **Blue** — estate/edge layer (devices, sensors, gateways)
- 🟢 **Green** — cloud services layer
- 🟡 **Amber** — AI/model layer
- ⚪ **Grey** — data storage / general infrastructure
- 🔴 **Red** — alerts, high-confidence/urgent paths, or targets

---

## app-stack.svg
**System Architecture Stack**

The full technical stack in one view, top to bottom: estate/edge devices
(ride, enclosure, and BLE sensors, all LoRaWAN) → 3 LoRaWAN gateway
concentrators → MQTT broker (TLS per-gateway) → cloud services layer
(Ingestion, Popularity Analytics, Animal Monitoring, Ticketing
Integration — payment/issuance only, Identity & Access — OAuth/OIDC for
visitors and staff) → AI/model layer (anomaly detection, vision
counting, model abstraction layer) → data layer (time-series DB,
relational DB, object storage). Use this as the single reference diagram
for "how does the whole system fit together."

**Related:** ADR001, ADR002, ADR005, ADR006, ADR009, ADR010, ADR012,
ADR013, ADR014, ADR015, ADR016

---

## c2-container-diagram.svg
**System Container Diagram (C4, Level 2)**

![C4 container diagram showing Visitor, Keeper, and Operations Staff actors; the external Ticketing SaaS Platform; and the platform's containers — LoRaWAN gateway concentrators, MQTT broker, OAuth/OIDC identity, ticketing integration service, ingestion service, popularity analytics service, animal monitoring service, AI inference layer, three data stores, the ops and keeper dashboard, and the observability stack](c2-container-diagram.svg)

The same system as app-stack.svg, redrawn in formal C4 notation:
actors (Visitor, Keeper, Operations Staff), the external Ticketing SaaS
Platform, and every container inside the platform boundary, with each
relationship arrow labeled by the protocol/technology it uses (LoRaWAN,
MQTT/TLS, HTTPS, OAuth 2.0/OIDC, internal API). Use this when the
question is specifically "what talks to what, and how" rather than
"which layer does this belong to."

**Related:** ADR001, ADR002, ADR003, ADR005, ADR007, ADR009, ADR010,
ADR012, ADR014, ADR015, ADR016, ADR017

---

## uc02-animal-monitoring-c3.svg
**UC02 — Animal Monitoring Service: Component Diagram (C4, Level 3)**

![Component diagram zooming into the Animal Monitoring Service container: sensor/keeper event adapter, species-tier router, baseline profile store accessor, anomaly detection engine, alert tiering engine, notification dispatcher, keeper feedback capture, model tuning feedback writer, golden-set regression client, and drift monitor client, plus the edge gateway's urgent local-alert bypass path](uc02-animal-monitoring-c3.svg)

Zooms one level past the container diagram into the single container
with the most internal complexity: the Animal Monitoring Service. Shows
the pipeline from event ingestion through species-tier routing,
baseline lookup, AI-inference-backed anomaly scoring, alert tiering,
and notification — plus the keeper-feedback loop that curates the
golden set and feeds drift monitoring. The edge gateway's local
threshold engine is shown as an external component with its own
red urgent-alert path that bypasses the cloud pipeline entirely when a
zone is offline (ADR002).

**Related:** ADR001, ADR002, ADR005, ADR007, ADR010, ADR011, ADR012,
ADR014, ADR017, ADR020

---

## high-level-flow-diagram.svg
**High-Level Flow — Visitor to Insight**

Three parallel swim-lanes showing how data moves from a real-world
trigger to an outcome: (1) a visitor scanning a ticket through to the
operations dashboard — noting that visitor identity is OAuth/OIDC, not
the ticketing SaaS — (2) an animal's LoRaWAN sensor/keeper data through
a gateway concentrator to a confirmed health alert, and (3) a scheduled
piranha photo capture through to a population-decline flag. Shows where
human confirmation sits in each loop.

**Related:** UC01, UC02, UC03, ADR001, ADR002, ADR007, ADR016

---

## uc01-popularity-analytics-dataflow.svg
**UC01 — Popularity Analytics Data Flow**

Zooms into the popularity-tracking pipeline specifically: ticket-gate
scans and BLE presence counts (both over LoRaWAN) flow through one of 3
gateway concentrators into the ingestion service, land in the
time-series database, and are aggregated hourly (staffing) and daily
(investment trend) before reaching the ops dashboard. Notes the privacy
handling (BLE identifiers discarded after aggregation).

**Related:** UC01, ADR001, ADR003, ADR004, ADR018

---

## uc02-animal-monitoring-dataflow.svg
**UC02 — Animal Health & Feeding Monitoring Data Flow**

Shows the two-speed design: an "urgent path" where local LoRaWAN
gateway-concentrator thresholds raise an immediate alert even if the
zone's backhaul is offline, and a "normal path" where sensor and
keeper-logged data reach the cloud anomaly-detection model once
connectivity allows. High-confidence anomalies notify a keeper;
low-confidence ones are logged only. The keeper's confirm/dismiss
decision feeds back into model tuning.

**Related:** UC02, ADR001, ADR002, ADR005, ADR007, ADR011

---

## uc03-piranha-population-dataflow.svg
**UC03 — Jumping Piranha Population Counting Data Flow**

The periodic-sampling approach: a keeper captures photo/video during a
scheduled check, it's uploaded to object storage, a vision model
estimates the population count, and that estimate is compared against
the running history. A meaningful decline triggers a keeper review
rather than an automated response.

**Related:** UC03, ADR006, ADR014

---

## uc04-personalization-dataflow.svg
**UC04 — Returning Visitor Personalization Data Flow**

![UC04 data flow diagram showing Phase One's non-AI loyalty mechanism live at launch, and Phase Two's future AI-assisted flow from visitor authentication through popularity/ticketing history lookup, recommendation model, personalized offer, and engagement feedback looping back into model refinement](uc04-personalization-dataflow.svg)

Contrasts the two phases directly: Phase One (live at launch) is a
plain, non-AI loyalty mechanism applied automatically on a return
visit. Phase Two (future, dashed boxes) is gated on real data existing
first — a returning visitor authenticates via OAuth, their popularity
and ticketing history is queried, a recommendation model surfaces a
personalized offer, and engagement feedback loops back into model
refinement. The gate and privacy opt-out are called out explicitly at
the bottom.

**Related:** UC04, ADR008, ADR010, ADR011, ADR016, ADR018

---

## ai-guardrails-verification.svg
**AI Verification & Guardrails**

A three-part view of how the solution keeps AI outputs trustworthy:
(1) pre-deployment golden-set regression testing as a hard CI/CD
blocker, (2) provider-risk mitigation via the model abstraction layer
and preference for open models on lower-stakes tasks, and (3) in-
production drift monitoring and human feedback capture. The lower half
details the alert-tiering guardrail from ADR007 — the rule that no AI
output ever triggers an automated welfare or business action without a
human confirming first.

**Related:** ADR007, ADR010, ADR011, ADR020

---

## rollout-strategy.svg
**Rollout Strategy**

A four-phase delivery timeline: Phase 0 (foundations — ticketing, RF
survey then LoRaWAN sensors/gateways, OAuth identity for visitors and
staff, observability, simple loyalty), Phase 1 (popularity analytics
live), Phase 2 (animal monitoring piloted on 2-3 tiers plus piranha
counting), Phase 3 (scale monitoring to all 55 enclosures and evaluate
the trigger for AI-driven personalization). Each phase is gated by
pilot validation and staff sign-off before expanding, per the advice
recorded across the relevant ADRs.

**Related:** ADR001, ADR005, ADR007, ADR008, ADR016, UC04

---

## admin-dashboard.svg
**Operations Dashboard Mockup**

A mockup of what estate operations staff would actually see day to
day: top-line KPIs (visitors today, open animal alerts, busiest zone,
LoRaWAN gateways offline out of 3), a zone-popularity chart, a live
animal-health-alerts panel, and a 7-day investment-priority table with
trend and recommendation columns. Illustrates how UC01 and UC02's
outputs surface to a human decision-maker.

**Related:** UC01, UC02, ADR001, ADR003, ADR004, ADR007

---

## demand-chart.svg
**Visitor Growth Target**

A line chart projecting the path from ~5,000 to 15,000 visitors/day
over three years, with callouts showing which AI-driven use cases
(popularity analytics, healthy/monitored animals, future
personalization) are expected to contribute to that growth curve.

**Related:** UC01, UC02, UC03, UC04

---

## existing-architectural-characteristics.svg
**Architectural Characteristics**

A comparison table addressing the judges' criterion of whether the AI
additions match the existing system's architectural priorities.
Compares six characteristics (Reliability, Availability, Cost
Efficiency, Auditability, Elasticity, Adaptability) across the base
(pre-AI) system's priority level and how the AI additions align with,
extend, or intentionally raise that priority — most notably
Auditability and Adaptability, which are deliberately increased by the
AI verification (ADR011) and provider-portability (ADR010) work.

**Related:** ADR002, ADR005, ADR006, ADR007, ADR010, ADR011, ADR013

---

## test-approach-diagram.svg
**Test Approach — Two Tracks, One Confidence Model**

![Test approach diagram showing two parallel tracks — a conventional test pyramid for deterministic components and a golden-set/drift/human-feedback verification stack for AI components — converging on a shared observability stack, plus cross-cutting non-functional tests and test ownership by role](test-approach-diagram.svg)

Contrasts the conventional test pyramid used for deterministic
components (ticketing, ingestion, gateways, dashboards) with the
golden-set/shadow-eval/drift-monitoring/human-feedback stack used for
AI components, both converging on the shared observability stack
(ADR017). The lower bands cover cross-cutting non-functional tests
(load, resilience against a gateway backhaul outage, LoRaWAN/gateway
security, DR restore drills) and who owns each test type.

**Related:** ADR001, ADR007, ADR011, ADR015, ADR016, ADR017, ADR019,
ADR020

---

## use-cases-overview.svg
**Prioritized Automation Use Cases**

![Four cards showing the prioritized how-might-we questions for UC01 Visitor Popularity Analytics, UC02 Animal Health and Feeding Monitoring, UC03 Jumping Piranha Population Counting, and UC04 Returning Visitor Personalization](use-cases-overview.svg)

A single-view summary of the four use cases the AI investment is scoped
around, each framed as a "how might we" question with its solution
approach and lead ADR(s) — the entry point for the Solution section of
the top-level [README](../README.md).

**Related:** UC01, UC02, UC03, UC04, ADR003, ADR004, ADR005, ADR006,
ADR007, ADR008

---

## ai-ml-app-stack.svg
**AI/ML App Stack**

![AI/ML App Stack diagram showing the solution's components recast in the style of a16z's Emerging LLM App Stack — LoRaWAN/MQTT ingestion, species-tiered baseline models, storage, orchestration, verification gate, observability, alert tiering, and a model-provider/hosting cluster](ai-ml-app-stack.svg)

The solution's AI/ML architecture recast in the style of a16z's
"Emerging LLM App Stack" reference diagram, using this solution's real
components in place of the generic LLM-app building blocks: LoRaWAN/MQTT
ingestion in place of data pipelines, species-tiered baseline models in
place of an embedding model, time-series/object storage in place of a
vector database, the ops/keeper console in place of a playground,
event-driven orchestration in the center, ticketing/OAuth integrations
in place of APIs/plugins, and a golden-set verification gate,
observability stack, and alert-tiering/human-in-the-loop step in place
of an LLM cache, logging, and validation layer. The right-hand cluster
mirrors "LLM APIs and Hosting" with this solution's actual provider
choices: frontier/commercial API and open/self-hosted models (behind
the ADR010 abstraction layer), the selected cloud provider (ADR013),
and on-gateway edge inference (ADR002).

**Related:** ADR001, ADR002, ADR005, ADR007, ADR009, ADR010, ADR011,
ADR012, ADR013, ADR014, ADR016, ADR017, ADR020

---

## Diagram-to-Use-Case Index

| Use Case | Diagrams |
|---|---|
| UC01 — Popularity Analytics | uc01-popularity-analytics-dataflow, admin-dashboard, high-level-flow-diagram, demand-chart |
| UC02 — Animal Health & Feeding Monitoring | uc02-animal-monitoring-dataflow, uc02-animal-monitoring-c3, admin-dashboard, ai-guardrails-verification, high-level-flow-diagram, demand-chart |
| UC03 — Piranha Population Counting | uc03-piranha-population-dataflow, high-level-flow-diagram, demand-chart |
| UC04 — Returning Visitor Personalization | uc04-personalization-dataflow, rollout-strategy, demand-chart |
| Whole system | use-cases-overview, app-stack, c2-container-diagram, ai-ml-app-stack, existing-architectural-characteristics, rollout-strategy |
| Testing & Verification | test-approach-diagram, ai-guardrails-verification |
