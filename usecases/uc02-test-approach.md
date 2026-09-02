# Test Approach — UC02: Animal Health & Feeding Anomaly Detection

## Overview
This use case has the heaviest AI testing surface in the solution: a
species-tiered anomaly-detection model running partly at the edge
(local thresholds) and partly in the cloud, feeding a human-confirmed
alert workflow. Testing must cover both the deterministic
infrastructure (sensors, gateways, alert routing) and the
non-deterministic model behavior, with particular attention to
false-positive/false-negative tolerance given the animal-welfare
stakes.

---

## Part A — Traditional / Deterministic Testing

### Unit Tests
- Local gateway threshold logic (e.g. "no motion in N hours") — correct
  triggering at boundary values (ADR002).
- Alert-tiering classification logic (low-confidence → log only vs.
  high-confidence → notify) at defined confidence boundaries (ADR007).
- Keeper feedback capture/labeling logic — correctly associates a
  label with the specific alert instance.
- Species-tier assignment logic — an enclosure is correctly mapped to
  its monitoring profile (ADR005).

### Integration & Contract Tests
- Sensor-to-gateway data contract (weight, motion, feeding-station
  trigger payload shapes).
- Gateway-to-cloud event contract, including buffered/replayed events
  after a reconnect.
- Keeper-logged observation data contract — feeding amount/behavior
  notes correctly reach the model input pipeline alongside sensor data.

### End-to-End Tests
- Full urgent path: threshold breach at the gateway → immediate local
  alert raised, independent of cloud connectivity (validates ADR002's
  offline-alerting design directly).
- Full standard path: sensor + keeper data → cloud anomaly model →
  high-confidence alert → keeper notification → confirm/dismiss →
  feedback recorded (ADR007).
- Low-confidence path: anomaly detected but below the notify threshold
  → correctly logged only, no keeper interruption.

### Non-Functional Tests
- **Resilience:** simulate a zone WiFi outage during an active urgent
  condition — confirm the local threshold alert still fires and the
  richer cloud analysis catches up once reconnected.
- **Load:** simulate concurrent sensor streams from all 55 enclosures
  reporting simultaneously.
- **Security:** verify a compromised/revoked device (ADR015) cannot
  inject false sensor readings that would trigger a false alert.

### Traditional Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| Local alert latency (urgent path) | Time from threshold breach to local alert, independent of connectivity |
| Cloud alert latency (standard path) | Time from data arrival to model output, under normal connectivity |
| Sensor data ingestion success rate | ≥ 99.9% across all enclosures |
| Gateway-to-cloud data delivery after outage | 100% of buffered readings delivered, 0% duplicated |
| Alert routing correctness | 100% of alerts routed to the correct tier (log vs. notify) per defined thresholds |

---

## Part B — AI / Non-Deterministic Testing

### Golden-Set Regression Testing
- A curated set of known sensor/keeper-data inputs with expected
  anomaly classifications, per species tier, run before every model
  deployment and after any provider change (ADR010, ADR011) — a hard
  CI/CD gate (ADR020).
- Golden set must include known-normal cases (to test against false
  positives) and known-anomalous cases (to test against false
  negatives) for each tier.

### Shadow / Canary Evaluation
- For any change to the anomaly-detection model, run the new version
  alongside the current one on live data for a defined period before
  fully switching over, given the welfare stakes of this feature
  (ADR011).

### Production Drift Monitoring
- Track alert-frequency and confidence-score distributions per tier
  over time; flag statistically significant shifts even without
  immediate ground truth (ADR011), surfaced via the shared
  observability stack (ADR017).

### Human Feedback Loop
- Every keeper confirm/dismiss decision is captured and used both as
  an accuracy signal and as future model-tuning input (ADR007).
- Track feedback volume per tier to ensure enough labeled data exists
  before attempting threshold auto-tuning (per ADR007's advice: collect
  a full season before tuning).

### AI Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| False-positive rate (per tier) | Within the tolerance keepers defined pre-launch (ADR007) |
| False-negative rate (per tier) | As close to zero as feasible for high-confidence/urgent conditions |
| Precision / Recall / F1 on golden set | Tracked per tier per model version; regression vs. prior version blocks deploy |
| Keeper agreement rate (human vs. model) | Cohen's kappa or simple agreement %, tracked over time per tier |
| Alert-to-confirmation time | How long a notified alert sits before a keeper responds |
| Drift signal frequency | Number of statistically significant distribution shifts flagged per month, investigated |
| Golden-set pass rate | 100% required to deploy (hard gate, ADR020) |
| Model inference latency | Cloud path — time from data arrival to classification |
| Feedback volume per tier | Sufficient sample size before any threshold auto-tuning is attempted |

---

## Acceptance Criteria (Definition of Done)
- False-positive rate stays within the tolerance keepers defined
  before launch.
- No confirmed health issue goes undetected for more than one keeper
  check-in cycle.
- Local threshold alerts function correctly during a simulated WiFi
  outage.

## Test Data Requirements
- Synthetic sensor-data generator per species tier, capable of
  producing both normal and anomalous patterns.
- A golden set per tier, co-developed with keeper staff to ensure
  clinical/behavioral plausibility, not just statistically anomalous
  values.
- At least one full pilot season's worth of real keeper-labeled data
  before attempting any threshold retuning.

## Related ADRs
ADR001, ADR002, ADR005, ADR007, ADR010, ADR011, ADR015, ADR017, ADR020
