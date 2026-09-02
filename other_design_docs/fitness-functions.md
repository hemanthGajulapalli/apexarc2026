# Fitness Functions

## What Is a Fitness Function?

A fitness function is an automated, objective way of checking whether
the architecture still exhibits a characteristic the team cares about,
as the system evolves. Rather than relying on a one-time design review,
fitness functions run continuously (or at defined trigger points) and
fail loudly when the architecture drifts from what was intended.

This matters especially for this solution because several of its
components are non-deterministic (ADR011) — a traditional pass/fail
test can't fully capture whether an AI feature is "still working," so
some of the fitness functions below are statistical rather than
binary.

## How to Read This Document

Each fitness function specifies:
- **Characteristic it protects** (ties to
  [Architecture Characteristics](architecture-characteristics.md))
- **Type** — Atomic (tests one thing in isolation) or Holistic (tests
  an emergent property across components)
- **Trigger** — Continuous (always running), Triggered (runs on a
  specific event, e.g. deploy), or Periodic (runs on a schedule)
- **Mechanism** — how it's actually implemented

---

## Reliability & Data Integrity

### FF-01: Zero data loss during simulated WiFi outage
- **Protects:** Reliability
- **Type:** Atomic
- **Trigger:** Triggered — runs in staging before every release
  affecting the ingestion path
- **Mechanism:** Automated chaos test disconnects a simulated zone
  gateway for 10/30/60 minutes, then verifies 100% of buffered events
  are delivered with zero duplication on reconnect (ADR001).

### FF-02: Alert routing correctness
- **Protects:** Reliability
- **Type:** Atomic
- **Trigger:** Continuous (CI on every commit touching alert logic)
- **Mechanism:** Unit/integration test suite asserting known
  confidence-score inputs route to the correct tier (log-only vs.
  notify) per the thresholds agreed with keeper staff (ADR007).

---

## AI Trustworthiness

### FF-03: Golden-set regression pass rate
- **Protects:** Auditability, correctness of AI outputs
- **Type:** Holistic
- **Trigger:** Triggered — every model or provider deployment (ADR010)
- **Mechanism:** Hard CI/CD gate (ADR020) — a model change cannot
  deploy unless it passes 100% of the curated golden-set test cases
  per species tier / feature. A failing run blocks deployment without
  an explicit, logged override.

### FF-04: Output distribution drift
- **Protects:** Correctness over time, without requiring ground truth
- **Type:** Holistic
- **Trigger:** Continuous, in production
- **Mechanism:** Statistical monitoring (e.g. population stability
  index or similar) on alert frequency and confidence-score
  distributions per tier, surfaced via the shared observability stack
  (ADR017). A significant shift raises an investigation, not an
  automatic rollback — human judgment decides the response (ADR011).

### FF-05: Keeper agreement rate
- **Protects:** Trustworthiness of animal-welfare alerts specifically
- **Type:** Holistic
- **Trigger:** Periodic (monthly review)
- **Mechanism:** Aggregate the true/false-positive labels keepers
  assign to alerts (ADR007) into an agreement rate per tier; a
  declining trend triggers a model/threshold review before it erodes
  into full alert fatigue.

---

## Cost Efficiency

### FF-06: Cost-per-visitor-day trend
- **Protects:** Cost Efficiency
- **Type:** Holistic
- **Trigger:** Periodic (monthly)
- **Mechanism:** Cloud + SaaS spend divided by visitor volume, tracked
  over time. A rising trend independent of feature additions signals
  a cost regression worth investigating (ties to the estimates in
  [Cost Analysis](cost-analysis.md)).

### FF-07: Storage growth vs. retention policy
- **Protects:** Cost Efficiency, Privacy compliance
- **Type:** Atomic
- **Trigger:** Periodic (weekly)
- **Mechanism:** Automated check that time-series and object storage
  volumes are shrinking/rolling off in line with the retention policy
  (ADR018, ADR019) — catches a retention-policy bug before it becomes
  an unbounded storage bill or a compliance issue.

---

## Adaptability & Portability

### FF-08: Provider swap smoke test
- **Protects:** Adaptability (model/provider portability)
- **Type:** Holistic
- **Trigger:** Periodic (quarterly) + Triggered (before any real
  provider migration)
- **Mechanism:** Run one AI feature's inference path through the
  abstraction layer (ADR010) against an alternate provider/model in a
  non-production environment, confirming the swap requires only
  configuration changes, not code changes.

---

## Resilience & Recoverability

### FF-09: Disaster recovery restore drill
- **Protects:** Recoverability
- **Type:** Holistic
- **Trigger:** Periodic (quarterly)
- **Mechanism:** Actually execute a point-in-time recovery from backup
  for the relational store (ADR019), not just confirm backups exist —
  measure actual restore time against the target.

### FF-10: Device revocation effectiveness
- **Protects:** Security
- **Type:** Atomic
- **Trigger:** Periodic (quarterly) + Triggered (on any reported
  device loss/theft)
- **Mechanism:** Revoke a test device's TLS certificate (ADR015) and
  confirm it can no longer publish to the MQTT broker within a defined
  time window.

---

## Governance of the Fitness Function Suite Itself

- New fitness functions are added whenever a new ADR introduces a
  characteristic worth protecting — this document should grow with the
  architecture, not stay fixed at launch.
- Fitness functions that consistently pass without ever catching a
  regression should be periodically reviewed — an untested fitness
  function provides false confidence, just like an untested backup.
- Holistic fitness functions (FF-03 through FF-09) are reviewed by
  engineering together with the relevant domain owner (keeper staff
  for FF-05, operations for FF-06) — a fitness function that only
  engineering understands is easy to silently ignore.

## Related Documents
- [Architecture Characteristics](architecture-characteristics.md)
- [Cost Analysis](cost-analysis.md)
- [Test Approach](diagrams/test-approach.md)
