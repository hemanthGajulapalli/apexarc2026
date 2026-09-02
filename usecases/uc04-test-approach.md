# Test Approach — UC04: Returning Visitor Personalization

## Overview
This use case is explicitly phased (ADR008): Phase One is a
non-AI loyalty mechanism, live at launch; Phase Two is an AI-driven
recommendation feature, deferred until sufficient ticketing/popularity
data exists. Testing is scoped accordingly — Phase One gets
conventional testing now, Phase Two's AI testing approach is documented
here so it's ready to apply once that phase is greenlit, rather than
designed from scratch later.

---

## Part A — Traditional / Deterministic Testing (Phase One — Live at Launch)

### Unit Tests
- Loyalty mechanism eligibility logic (e.g. discount-eligible renewal
  window, digital loyalty card increment logic).
- Loyalty benefit application logic at checkout — correct discount/
  benefit applied for an eligible returning visitor.

### Integration & Contract Tests
- Loyalty status contract with the ticketing SaaS platform (ADR009) —
  correct read/write of loyalty status alongside ticket purchase.

### End-to-End Tests
- Full journey: a visitor's second purchase correctly triggers the
  loyalty benefit at checkout, with no personalization logic involved
  yet.
- Opt-out journey: a visitor who declines the loyalty mechanism is not
  enrolled and is not affected by future personalization once it
  launches (ADR018 privacy/consent handling).

### Traditional Test Metrics to Capture
| Metric | Target / Notes |
|---|---|
| Loyalty benefit application accuracy | 100% of eligible returning visitors receive the correct benefit |
| Enrollment/opt-out correctness | 100% — a visitor's stated preference is honored on every subsequent visit |
| Loyalty-mechanism uptake rate | Tracked as a business metric, not a pass/fail test, to inform the Phase Two trigger decision |

---

## Part B — AI / Non-Deterministic Testing (Phase Two — Future, Once Triggered)

This section defines the test approach to apply **when** Phase Two is
greenlit (per the data-volume trigger in ADR008) — it is written now so
the team isn't designing AI test strategy under launch pressure later.

### Golden-Set / Offline Evaluation
- Before any live rollout, evaluate the recommendation model offline
  against a held-out set of historical visitor journeys, measuring
  whether it would have recommended attractions the visitor actually
  went on to visit (a proxy for relevance).

### Shadow / A-B Style Evaluation
- Run the recommendation feature for a subset of returning visitors
  (or in shadow/non-visible mode) before a full rollout, comparing
  engagement against a non-personalized control group.

### Production Drift Monitoring
- Track recommendation acceptance/click-through rate and diversity of
  recommendations over time; a sustained drop or a collapse toward
  recommending only the same few attractions is a drift signal worth
  investigating (ADR011's approach applied to this feature).

### Human Feedback Loop
- Visitor engagement with a recommendation (accepted, ignored,
  dismissed) is captured as feedback, feeding ongoing model
  refinement — the "human" in this loop is the visitor, not staff, so
  feedback is implicit (behavioral) rather than an explicit label.

### AI Test Metrics to Capture (Phase Two)
| Metric | Target / Notes |
|---|---|
| Offline relevance (precision@k / recall@k) | Measured against held-out historical visitor journeys before any live rollout |
| Click-through / acceptance rate | Tracked in shadow/A-B phase before full rollout |
| Recommendation diversity | Avoids collapsing to the same few attractions for all visitors |
| Repeat-visit rate uplift | Personalized cohort vs. non-personalized control (the actual business metric ADR008 is trying to move) |
| Drift in recommendation distribution | Monitored continuously once live |
| Opt-out rate | Visitors declining personalization — a signal of trust/comfort with the feature |

---

## Acceptance Criteria (Definition of Done)

**Phase One:**
- Measurable uptake of the loyalty mechanism among repeat visitors
  within the first season.

**Phase Two (once triggered):**
- A defined, agreed threshold of ticketing/popularity data volume is
  reached before development begins (ADR008).
- Offline evaluation shows the recommendation model outperforms a
  simple non-personalized baseline before any live rollout.
- Once live: improvement in returning-visitor rate attributable to
  personalized recommendations, measured against the Phase One
  baseline.

## Test Data Requirements
**Phase One:** ticketing/loyalty transaction data, already available
via ADR009.
**Phase Two:** at least one full season of ticketing and popularity
history (ADR003) to construct offline evaluation datasets and held-out
test journeys.

## Related ADRs
ADR003, ADR008, ADR009, ADR010, ADR011, ADR018
