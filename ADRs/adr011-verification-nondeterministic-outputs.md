# ADR011 - Verification of Non-Deterministic AI Outputs
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Combine **human-in-the-loop feedback capture** (already established by
ADR007 for animal alerts, extended to all AI features) with
**statistical drift monitoring** on output distributions (alert
frequency, confidence scores, popularity-estimate variance) as the
primary production verification approach. **Golden-set regression
testing** is used pre-deployment and after any model/provider change
(ADR010), rather than continuously in production.

## Context
GenAI/ML functionality is non-deterministic, unlike the estate's other
deterministic systems (ticketing, gate logic). We need to know when an
AI-driven feature has started misbehaving in production — not just
verify it worked at launch — across several distinct feature types
(vision counting, anomaly detection, popularity estimation).

## Options Considered

### Option 1 (SELECTED): Human feedback loop + drift monitoring + golden-set at deploy time
Every AI output that reaches a human (keeper alert confirmations per
ADR007, any future visitor-facing recommendation) is labeled
correct/incorrect, building a continuous accuracy signal per feature.
Independently, each feature's output distribution (e.g. how often it
alerts, its confidence scores) is monitored for statistically
significant shifts, which don't require ground truth to detect and can
catch drift human review alone might miss. A curated golden-set of known
inputs/expected outputs is run before every deployment and after any
model or provider change, to catch regressions before they reach
production.

#### Consequences
* Adopted because: combines a ground-truth signal (human feedback,
  where available) with a ground-truth-independent signal (statistical
  drift), covering cases where humans can't easily confirm correctness
  (e.g. subtle population undercounts).
* Adopted because: golden-set testing at deploy time catches obvious
  regressions cheaply, without the cost of running it continuously in
  production.
* Adopted despite: statistical drift monitoring can flag "different"
  without necessarily meaning "wrong" — needs human judgment to
  interpret, not fully automatable.
* Adopted despite: requires building a lightweight monitoring dashboard
  across all AI features, an additional piece of shared infrastructure.

### Option 2: Shadow/canary deployment for all model changes
Every new model version runs alongside the current one on live data,
comparing outputs before fully switching over.

#### Consequences
* Rejected as the sole approach because: doubles inference cost/
  complexity for every model update, which is disproportionate for the
  estate's lower-stakes features; kept as an optional practice for
  high-stakes changes (e.g. a provider swap affecting animal alerts)
  rather than a blanket requirement.
* Rejected despite: gives the strongest pre-production confidence that
  a change won't regress behavior.

### Option 3: Golden-set regression testing only
Rely solely on pre-deployment golden-set tests, with no ongoing
production monitoring.

#### Consequences
* Rejected because: doesn't catch drift that emerges only in production
  over time (e.g. gradual sensor degradation changing input
  distributions) — exactly the "does it work six months in" question the
  brief raises.
* Rejected despite: simplest and cheapest option to implement.

## Advice
* Define, per AI feature, which of the two production signals (human
  feedback vs. drift monitoring) is the primary trust source, since not
  every feature will have reliable human feedback available (e.g.
  population counting has sparse ground truth). - Engineering Lead,
  Sep 2026

## Supporting Material
* Spike 011: Verification of non-deterministic outputs
* ADR007: Alert Validation & False-Positive Tolerance
* ADR010: Model & Provider Portability Strategy
