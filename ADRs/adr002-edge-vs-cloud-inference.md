# ADR002 - Edge vs. Cloud Inference Strategy
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use a **hybrid inference strategy**: simple threshold-based alerting runs
locally on zone gateways (from ADR001) for the most time-critical
conditions (e.g. "no motion detected in N hours"), while richer ML-based
analysis (anomaly detection, population counting) runs in the cloud on
data delivered via the store-and-forward pipeline.

## Context
Animal welfare monitoring needs to keep working even when WiFi in a zone
is down, since a delayed alert has real welfare cost. But running full
ML models on every gateway device is expensive and adds hardware/
maintenance burden across 55 enclosures. We need an approach that covers
urgent cases without paying for edge ML everywhere.

## Options Considered

### Option 1 (SELECTED): Hybrid — local thresholds + cloud ML
Gateways run simple, cheap rule-based checks locally (no model needed —
just thresholds on sensor readings) and raise an immediate local alert
if thresholds are breached, independent of connectivity. All raw data
still flows to the cloud (once connectivity allows) where richer anomaly
detection and trend analysis run.

#### Consequences
* Adopted because: covers the urgent case (animal shows no activity)
  without needing model-capable hardware at every gateway — thresholds
  are cheap to run on modest hardware.
* Adopted because: cloud-side ML can be iterated on and retrained
  without touching deployed hardware.
* Adopted despite: local thresholds are cruder than a full model and
  will need careful tuning per species/enclosure to avoid false alarms
  (see ADR007).
* Adopted despite: two code paths (local rules + cloud model) to
  maintain rather than one.

### Option 2: Full edge inference everywhere
Every gateway runs a lightweight ML model locally.

#### Consequences
* Rejected because: requires more capable (costlier) hardware at all 55
  enclosures, which doesn't fit a cost-conscious budget when only a
  subset of conditions are truly time-critical.
* Rejected despite: fully resilient to connectivity loss and avoids any
  cloud-inference delay.

### Option 3: Cloud-only inference
No local logic at all; every alert waits for data to reach the cloud.

#### Consequences
* Rejected because: during a WiFi outage, a genuinely urgent animal
  welfare issue could go undetected for hours — unacceptable given the
  estate's stated priority on animal health.
* Rejected despite: simplest architecture, single inference path to
  maintain.

## Advice
* Start local thresholds conservative (fewer false negatives) and tune
  based on real keeper feedback once live — see ADR007. -
  Engineering Lead, Sep 2026

## Supporting Material
* Spike 002: Edge vs. cloud inference
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
