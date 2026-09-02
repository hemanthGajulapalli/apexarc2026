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
(ride and enclosure sensors, zone gateways, BLE sensors) → MQTT broker →
cloud services layer (Ingestion, Popularity Analytics, Animal
Monitoring, Ticketing Integration) → AI/model layer (anomaly detection,
vision counting, model abstraction layer) → data layer (time-series DB,
relational DB, object storage). Use this as the single reference diagram
for "how does the whole system fit together."

**Related:** ADR001, ADR002, ADR005, ADR006, ADR010, ADR012, ADR014

---

## high-level-flow-diagram.svg
**High-Level Flow — Visitor to Insight**

Three parallel swim-lanes showing how data moves from a real-world
trigger to an outcome: (1) a visitor scanning a ticket through to the
operations dashboard, (2) an animal's sensor/keeper data through to a
confirmed health alert, and (3) a scheduled piranha photo capture
through to a population-decline flag. Shows where human confirmation
sits in each loop.

**Related:** UC01, UC02, UC03, ADR001, ADR002, ADR007

---

## uc01-popularity-analytics-dataflow.svg
**UC01 — Popularity Analytics Data Flow**

Zooms into the popularity-tracking pipeline specifically: ticket-gate
scans and BLE presence counts flow through the zone gateway into the
ingestion service, land in the time-series database, and are aggregated
hourly (staffing) and daily (investment trend) before reaching the ops
dashboard. Notes the privacy handling (BLE identifiers discarded after
aggregation).

**Related:** UC01, ADR003, ADR004, ADR018

---

## uc02-animal-monitoring-dataflow.svg
**UC02 — Animal Health & Feeding Monitoring Data Flow**

Shows the two-speed design: an "urgent path" where local gateway
thresholds raise an immediate alert even if the zone is offline, and a
"normal path" where sensor and keeper-logged data reach the cloud
anomaly-detection model once connectivity allows. High-confidence
anomalies notify a keeper; low-confidence ones are logged only. The
keeper's confirm/dismiss decision feeds back into model tuning.

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

A four-phase delivery timeline: Phase 0 (foundations — ticketing,
ingestion, observability, simple loyalty), Phase 1 (popularity
analytics live), Phase 2 (animal monitoring piloted on 2-3 tiers plus
piranha counting), Phase 3 (scale monitoring to all 55 enclosures and
evaluate the trigger for AI-driven personalization). Each phase is
gated by pilot validation and staff sign-off before expanding, per the
advice recorded across the relevant ADRs.

**Related:** ADR005, ADR007, ADR008, UC04

---

## admin-dashboard.svg
**Operations Dashboard Mockup**

A mockup of what estate operations staff would actually see day to
day: top-line KPIs (visitors today, open animal alerts, busiest zone,
gateways offline), a zone-popularity chart, a live animal-health-alerts
panel, and a 7-day investment-priority table with trend and
recommendation columns. Illustrates how UC01 and UC02's outputs surface
to a human decision-maker.

**Related:** UC01, UC02, ADR003, ADR004, ADR007

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

## Diagram-to-Use-Case Index

| Use Case | Diagrams |
|---|---|
| UC01 — Popularity Analytics | uc01-popularity-analytics-dataflow, admin-dashboard, high-level-flow-diagram, demand-chart |
| UC02 — Animal Health & Feeding Monitoring | uc02-animal-monitoring-dataflow, admin-dashboard, ai-guardrails-verification, high-level-flow-diagram, demand-chart |
| UC03 — Piranha Population Counting | uc03-piranha-population-dataflow, high-level-flow-diagram, demand-chart |
| UC04 — Returning Visitor Personalization | rollout-strategy, demand-chart |
| Whole system | app-stack, existing-architectural-characteristics, rollout-strategy |
