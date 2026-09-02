# ADR007 - Alert Validation & False-Positive Tolerance
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use a **tiered alert severity model with mandatory human-in-the-loop
confirmation**: AI-generated alerts (health, feeding, population) are
classified by confidence into "log only" (low confidence, no
notification) and "notify" (high confidence, pushed to keeper staff).
No alert triggers an automated action directly — a keeper always
confirms before any response. Every notified alert is labeled
true/false-positive by the keeper who reviews it, feeding a continuous
tuning loop.

## Context
Animal monitoring (ADR005, ADR006) will generate alerts. Alert fatigue
from too many false positives would cause keepers to ignore genuinely
important signals; over-conservative tuning risks missing real issues.
The estate has no existing baseline data to tune against initially, so
the validation approach needs to work from day one and improve over
time.

## Options Considered

### Option 1 (SELECTED): Tiered severity + human-in-the-loop + feedback loop
Low-confidence anomalies are logged for later review (not pushed to
staff); high-confidence anomalies generate a notification. Every
notification requires keeper confirmation before any follow-up action,
and the keeper's true/false-positive label is captured and used to
retrain/tune thresholds over time.

#### Consequences
* Adopted because: keeps keepers in control of any consequential
  decision, addressing both animal welfare risk and the judges'
  criterion on validating AI results.
* Adopted because: the continuous feedback loop means alert quality
  should improve over the estate's first season, rather than staying
  fixed at initial (necessarily rough) thresholds.
* Adopted despite: requires building a simple labeling UI/workflow for
  keepers, which is additional scope beyond the core monitoring
  pipeline.
* Adopted despite: without pre-existing baseline data, initial
  thresholds will be conservative estimates and likely to need early
  adjustment.

### Option 2: Fixed threshold with periodic manual review only
Set a conservative threshold at launch, review overall false-positive/
negative rates monthly rather than per-alert.

#### Consequences
* Rejected because: without per-alert feedback, tuning is slower and
  less precise — a month of noisy alerts could already have caused
  keepers to disengage before the first review happens.
* Rejected despite: simpler to build, no per-alert labeling workflow
  needed.

### Option 3: Fully automated response (no human confirmation)
AI-detected anomalies trigger automated actions (e.g. auto-scheduling a
vet visit) without keeper review.

#### Consequences
* Rejected because: unacceptable risk given non-deterministic model
  behavior and the welfare/cost stakes of an incorrect automated
  response.
* Rejected despite: fastest possible response time to a genuine issue.

## Advice
* Collect at least one full season of keeper-labeled alerts before
  attempting any threshold auto-tuning; don't over-fit to the first few
  weeks of necessarily sparse data. - Animal Welfare Lead, Sep 2026
* Define acceptance criteria (target false-positive rate keepers find
  tolerable) with keeper staff directly before launch, not after
  complaints start. - Animal Welfare Lead, Sep 2026

## Supporting Material
* Spike 007: False-positive tolerance for animal alerts
* ADR005: Animal Health & Feeding Monitoring Approach
* ADR011: Verification of Non-Deterministic AI Outputs
