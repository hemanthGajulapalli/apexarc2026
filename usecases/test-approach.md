# Test Approach — Von Digitalis Estates

## 1. Testing Philosophy

The solution has two fundamentally different kinds of components, and
they need different testing strategies:

- **Deterministic components** — ticketing integration, ingestion,
  gateways, dashboards, storage — behave the same way given the same
  input every time. These are tested with a conventional test pyramid.
- **Non-deterministic AI components** — anomaly detection, vision-based
  population counting, any future recommendation model — can produce
  different outputs for similar inputs, and "correct" is a statistical
  property, not a fixed assertion. These need the additional
  verification approach defined in ADR011, layered on top of (not
  instead of) conventional testing.

Test investment is scaled to risk: animal-welfare-affecting and
payment-affecting paths get the most rigorous testing; low-stakes
dashboard cosmetics get the least. This mirrors the cost-conscious
approach taken throughout the architecture decisions (see the ADR
summary's "keep operational surface area small" theme).

## 2. Test Levels — Deterministic Components

### Unit tests
- Zone gateway buffering/deduplication logic (ADR001).
- Ingestion service event handling.
- Popularity aggregation job logic (hourly/daily rollups, ADR004).
- Ticketing webhook adapter/integration layer (ADR009).
- Alert-tiering threshold logic (ADR007).

### Integration & contract tests
- MQTT topic schema contracts between gateways and the ingestion
  service (ADR001, ADR015).
- Ticketing SaaS webhook contract (verify payload shape matches what
  the integration layer expects, ADR009).
- Event-bus contracts between the modular services (ADR012) — each
  service's published event schema is versioned and contract-tested
  against its consumers.

### End-to-end tests
- Full visitor journey: ticket purchase → gate scan → event ingested →
  reflected in the popularity dashboard within the expected batch
  window (ADR004).
- Full animal-alert journey: sensor reading breaches threshold →
  keeper notified → confirmation recorded → feedback stored (ADR007).

### Non-functional tests
- **Load/performance:** simulate peak-day traffic at the 15,000
  visitors/day growth target (not just current ~5,000/day) across
  ticketing, ingestion, and analytics.
- **Resilience/chaos:** simulate WiFi outages of varying duration per
  zone and verify local buffering, no data loss, and correct
  deduplication on reconnect (validates ADR001's design directly).
- **Security:** verify per-device certificate provisioning/revocation
  (ADR015) and staff RBAC boundaries (ADR016) with both positive and
  negative test cases (e.g. a revoked device cannot publish).
- **Disaster recovery:** periodically execute an actual restore drill
  from backup (ADR019), not just confirm backups exist.

## 3. Test Levels — AI Components

### Golden-set regression testing (pre-deployment gate)
A curated set of known inputs with expected outputs, run before every
model deployment and after any model/provider change (ADR010,
ADR011). This is a **hard blocker** in the CI/CD pipeline (ADR020) — a
failing model change cannot deploy without an explicit, logged
override.

### Shadow/canary evaluation (high-stakes changes)
For changes affecting animal-welfare alerting specifically, run the
new model version alongside the current one on live data and compare
outputs before fully switching over — an optional but recommended
practice for the highest-stakes change category (ADR011).

### Production drift monitoring (continuous)
Track each AI feature's output distribution (alert frequency,
confidence scores, population-count variance) for statistically
significant shifts, independent of whether ground truth is available
(ADR011). This is not a pass/fail gate but an ongoing signal that
surfaces on the shared observability stack (ADR017).

### Human feedback capture (continuous)
Every keeper confirmation/dismissal of an animal-health alert (ADR007)
and every keeper cross-check of a piranha population count (ADR006) is
captured as a labeled data point, feeding both accuracy measurement
and future model tuning.

### Threshold/tiering validation
Test that the alert-tiering logic (ADR007) correctly classifies a set
of known test cases into "log only" vs. "notify" at the confidence
boundaries the team has agreed with keeper staff — this is tested as
conventional logic (unit-testable) even though the underlying model
score is not.

## 4. Test Environments & Data

- **Staging environment** mirrors the production zone-gateway setup,
  including simulated patchy WiFi, so resilience behavior can be
  tested before every release, not just once.
- **Synthetic sensor data** is generated for enclosure types not yet
  covered by a live pilot, so anomaly-detection models can be
  regression-tested even before full estate-wide sensor rollout
  (ties to the phased rollout in ADR005/rollout-strategy).
- **Pilot zones** (per the phased rollout) double as a controlled
  real-world test bed — the 2-3 highest-value animal tiers and the
  initial BLE-equipped popularity zones are the first place new
  behavior is validated against real conditions before wider rollout.

## 5. Test Ownership & Cadence

| Test type | Owner | Cadence |
|---|---|---|
| Unit / integration / contract | Engineering | Every commit (CI) |
| End-to-end | Engineering | Every release |
| Golden-set regression | Engineering | Every model/provider change (ADR020) |
| Load/chaos/security/DR | Engineering | Pre-release + quarterly drill |
| Alert false-positive/negative review | Keeper/animal welfare staff | Ongoing (per ADR007), reviewed monthly |
| Popularity accuracy spot-check | Operations staff | Ongoing, compared against known busy/quiet days |
| Golden-set curation refresh | Engineering + keeper staff | Each new pilot tier added |

## 6. Acceptance Criteria by Use Case

Reuses the success metrics already defined per use case, so "done" is
consistently defined across design and test:

- **UC01 (Popularity Analytics):** operations staff can identify
  top/bottom 5 attractions within an hour of shift start; 100% of
  zones report at least ticket-gate-level data.
- **UC02 (Animal Health Monitoring):** false-positive rate stays within
  the tolerance keepers defined pre-launch (ADR007); no confirmed
  issue goes undetected beyond one keeper check-in cycle.
- **UC03 (Piranha Population Counting):** vision-model count validated
  against manual counts within agreed tolerance before unsupervised
  trust; a meaningful decline is detected within one sampling cycle.
- **UC04 (Returning Visitor Personalization):** phase-two development
  does not begin until the agreed ticketing/popularity data threshold
  is met (ADR008).

## 7. What Is Explicitly Out of Scope for Automated Testing

- Judging whether a specific AI-flagged animal-health concern is
  clinically correct — this remains a keeper's professional judgment,
  not something a test suite asserts on.
- Visitor satisfaction/experience quality — measured via operational
  metrics (repeat-visit rate, ADR008) rather than test assertions.
