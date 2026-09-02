# Test Approach — UC03: Jumping Piranha Population Counting

## Overview
This use case centers on a computer-vision model estimating population
counts from periodically captured photo/video — a narrower, more
specialized AI surface than UC02, but with its own distinct testing
needs around counting accuracy under real-world visual conditions
(water clarity, occlusion, glare).

---

## Part A — Traditional / Deterministic Testing

### Unit Tests
- Media capture/upload logic — correct handling of photo vs. video,
  file size limits, upload retries.
- Historical-count comparison logic — correctly computes percentage
  change against the running history.
- Decline-threshold logic — correctly triggers a keeper-review flag at
  the defined change threshold.

### Integration & Contract Tests
- Media upload contract to object storage (ADR014) — correct metadata
  (enclosure ID, capture timestamp) attached to every upload.
- Contract between the vision model service and the comparison/
  alerting logic — count + confidence score correctly passed through.

### End-to-End Tests
- Full journey: scheduled capture → upload → vision model count →
  comparison against history → decline flagged (or not) → keeper
  review workflow triggered where applicable (ADR006).
- Missed-capture scenario: no capture for a cycle → system correctly
  handles the gap (no false decline triggered by a data gap, no crash).

### Non-Functional Tests
- **Load:** not a primary concern given the low frequency (periodic
  sampling), but verify the vision-inference pipeline handles capture
  bursts if multiple checks are logged close together.
- **Data integrity:** verify captured media is retained per the backup/
  retention policy (ADR014, ADR019) and correctly associated with its
  enclosure and date.

### Traditional Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| Upload success rate | ≥ 99% of captures successfully reach object storage |
| Metadata correctness | 100% of uploads correctly tagged with enclosure ID and timestamp |
| Comparison logic correctness | 100% accuracy against a hand-computed reference set of history sequences |
| Missed-capture handling | 0 false alerts triggered purely by a data gap |

---

## Part B — AI / Non-Deterministic Testing

### Golden-Set Regression Testing
- A curated set of reference photos/videos with known, verified
  (human-counted) population numbers, spanning a range of water
  clarity, lighting, and occlusion conditions — run before every model
  deployment or provider change (ADR010, ADR011), hard CI/CD gate
  (ADR020).

### Accuracy Validation Against Manual Counts
- Before trusting the model to flag declines unsupervised, run it in
  parallel with keeper manual counts over several sampling cycles and
  compare (per ADR006's advice) — this is the specific acceptance gate
  for this use case, distinct from the general golden-set process.

### Production Drift Monitoring
- Track the distribution of count-confidence scores over time; a
  sustained drop in confidence (e.g. due to gradual camera/water
  condition changes) is a signal worth investigating even without an
  immediate ground-truth mismatch (ADR011).

### Human Feedback Loop
- Every keeper cross-check (manual count vs. model count) is logged as
  a labeled data point, both to measure ongoing accuracy and to
  identify if/when the enclosure's visual conditions have degraded
  enough to need camera maintenance.

### AI Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| Mean Absolute Error (MAE) vs. manual count | Established acceptable tolerance agreed with keeper staff before go-live |
| Mean Absolute Percentage Error (MAPE) | Tracked over time; regression vs. baseline blocks deploy |
| Low-confidence capture rate | % of captures the model flags as too uncertain to auto-report — monitored as a proxy for enclosure visual-condition degradation |
| Golden-set pass rate | 100% required to deploy (hard gate) |
| False-decline rate | Declines flagged that a keeper's manual count did not confirm |
| Missed-decline rate | Real declines not flagged by the model, caught later via manual check |
| Model inference latency | Time from upload to count estimate |

---

## Acceptance Criteria (Definition of Done)
- Vision-model count accuracy validated against keeper manual counts
  within an agreed tolerance before being trusted unsupervised.
- A meaningful population decline is detected within one sampling
  cycle of it occurring.
- Keepers retain final judgment on any population-related welfare
  action — no automated response is triggered directly from a count.

## Test Data Requirements
- A reference photo/video library spanning realistic water-clarity,
  lighting, and occlusion conditions, each with a verified manual
  count.
- Ongoing paired manual-count data from the pilot period to validate
  and, if needed, retrain the model before wider trust is extended.

## Related ADRs
ADR005, ADR006, ADR007, ADR010, ADR011, ADR014, ADR019, ADR020
