# ADR013 - Cloud Platform Selection
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use a **single mainstream public cloud provider** (selected via standard
procurement comparison of managed MQTT/IoT ingestion, managed database,
and serverless compute pricing) for all cloud-hosted services, rather
than a multi-cloud or self-hosted-datacenter approach. Favor managed/
serverless offerings over self-managed infrastructure wherever the
estate's scale doesn't justify the operational overhead of self-managing.

## Context
The estate needs somewhere to run the services described in ADR012.
Team size is small, so operational overhead (patching, scaling,
on-call) is a real cost, not just infrastructure spend. The estate's
load is modest (5,000-15,000 visitors/day, ~100 devices) — not at a
scale that needs multi-cloud resilience or bespoke infrastructure.

## Options Considered

### Option 1 (SELECTED): Single mainstream cloud provider, managed/serverless-first
Pick one major provider with strong managed IoT/MQTT ingestion, managed
database, and serverless compute options; default to managed services
over self-hosted equivalents unless a specific need argues otherwise.

#### Consequences
* Adopted because: minimizes operational burden on a small team — no
  need to run and patch our own MQTT broker cluster or database
  servers.
* Adopted because: serverless/managed compute scales cost with actual
  usage, which fits a business whose traffic may vary significantly by
  season.
* Adopted despite: some degree of cloud-provider lock-in for
  infrastructure (distinct from the AI model/provider portability
  addressed in ADR010) — accepted as a reasonable trade-off given the
  team's size and the low likelihood of needing to migrate
  infrastructure providers.

### Option 2: Multi-cloud from day one
Distribute services across two or more cloud providers for redundancy.

#### Consequences
* Rejected because: adds significant operational complexity
  (cross-cloud networking, duplicated tooling, higher cost) not
  justified by the estate's current scale or risk profile.
* Rejected despite: highest resilience against a single provider
  outage.

### Option 3: Self-hosted datacenter/on-premises
Run all infrastructure on estate-owned hardware.

#### Consequences
* Rejected because: requires infrastructure expertise and on-call
  capacity the estate doesn't have, and doesn't scale elastically with
  seasonal visitor variation.
* Rejected despite: no recurring cloud costs and full control over
  hardware.

## Advice
* Compare 2-3 providers specifically on managed IoT/MQTT ingestion
  pricing at expected device volumes (~100 gateways, per ADR001) before
  finalizing — this is likely the largest variable cost driver.
  - Engineering Lead, Sep 2026

## Supporting Material
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR012: Overall System Architecture Style
