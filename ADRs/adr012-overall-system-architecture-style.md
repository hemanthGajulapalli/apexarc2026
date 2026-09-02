# ADR012 - Overall System Architecture Style
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Adopt an **event-driven, modular-service architecture** centered on the
MQTT broker/message bus as the backbone connecting estate-side devices
(ADR001) to a small set of independently deployable cloud services:
Ingestion, Popularity Analytics, Animal Monitoring, Ticketing
Integration, and AI Inference. Services communicate primarily via events
on the bus rather than direct synchronous calls, with a thin API layer
for anything visitor- or staff-facing.

## Context
The estate's solution spans several fairly independent concerns
(ticketing, popularity analytics, animal health, population counting)
that share a common data-in-motion pattern (device → cloud) but have
different scaling, latency, and reliability needs. We need an
architecture style that's affordable to build and operate for a
first-generation system, while not locking the estate into a rigid
structure that can't evolve as AI features mature.

## Options Considered

### Option 1 (SELECTED): Event-driven modular services over a shared bus
A small number of purpose-built services subscribe to and publish events
on the same MQTT/message bus used for device ingestion. Each service
owns its own data store and can be deployed, scaled, and evolved
independently.

#### Consequences
* Adopted because: naturally fits the estate's data pattern (many
  devices producing events over time) without forcing a separate
  request/response integration layer for every consumer.
* Adopted because: modular services can be built, deployed, and cost-
  scaled independently — e.g. Animal Monitoring can get more compute
  without over-provisioning Ticketing Integration.
* Adopted despite: event-driven systems are harder to debug/trace
  end-to-end than a simple monolith — addressed by ADR017's
  observability investment.
* Adopted despite: more moving parts to operate than a single
  monolithic application, which is a real cost for a small team.

### Option 2: Monolithic application
A single deployable application handling ticketing, analytics, and
animal monitoring together.

#### Consequences
* Rejected because: the very different scaling/latency needs across
  concerns (real-time alerting vs. batch analytics vs. payment
  processing) don't fit well in one deployable unit, and it would tie
  unrelated features' releases together.
* Rejected despite: simplest possible operational footprint for a
  small team — lower initial cost.

### Option 3: Full microservices (fine-grained, one service per capability)
Decompose into many small services (e.g. separate services per animal
tier, per ride, etc.).

#### Consequences
* Rejected because: over-engineered for the estate's actual scale —
  the operational overhead of many fine-grained services isn't
  justified by team size or load.
* Rejected despite: maximal independent scalability if the estate grew
  dramatically beyond current projections.

## Advice
* Keep the number of services deliberately small at launch (five, as
  listed in the Decision) and only split further if a specific
  scaling or team-ownership need arises. - Engineering Lead, Sep 2026

## Supporting Material
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
