# Timebox

3 days.

# Context

Deterministic functionality is easy to verify; GenAI/ML functionality is
non-deterministic, so "does it work?" needs a different answer than
traditional testing. We need to work out how we'll know an AI-driven
feature (popularity analytics, animal health alerts, any visitor-facing
AI) has started misbehaving once it's in production — not just at launch.

We need to answer this now because it's an explicit judging criterion
("validation and verification of AI results"), and it affects how much
monitoring/observability infrastructure needs to be built alongside the
AI features themselves, not bolted on afterward.

Constraints:
- Ground truth is often unavailable in real time (e.g. we won't always
  know instantly whether an "unwell animal" alert was correct).
- Team needs an approach that scales across multiple distinct AI
  features (vision, anomaly detection, analytics, possibly chat), not a
  bespoke solution per feature.

Interested parties: engineering team, animal welfare staff (trust in
alerts), the Countess (risk of AI feature silently failing).

# Options considered

1. **Golden-set regression testing** — maintain a curated set of known
   inputs/expected outputs per feature, re-run periodically to catch
   drift.
2. **Human-in-the-loop feedback capture** — every AI output (alert,
   recommendation) can be marked correct/incorrect by staff, building a
   continuous accuracy signal.
3. **Statistical drift monitoring** — track output distributions over
   time (e.g. alert frequency, confidence scores) and flag anomalous
   shifts even without ground truth.
4. **Shadow/canary deployment for model changes** — new model versions
   run alongside the current one on live data before fully replacing it,
   comparing outputs.

# Consequences

- Which of these approaches is feasible to stand up within the kata's
  scope vs. which is a "future work" item to note in the ADR?
- For animal health alerts specifically, how would we ever get reliable
  ground truth to validate against (keeper confirmation, ties to spike
  007)?
- Does the chosen approach differ per AI feature, or can one common
  monitoring pattern cover popularity analytics, animal monitoring, and
  any visitor-facing AI?
- What operational owner (role, not necessarily named person) is
  responsible for reacting to a detected drift/degradation?
