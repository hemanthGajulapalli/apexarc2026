# Timebox

2 days.

# Context

Animal health/population monitoring (spikes 005, 006) will produce
alerts. If the false-positive rate is too high, keepers will start
ignoring alerts ("alarm fatigue"), defeating the purpose. If tuned too
conservatively to avoid false positives, real issues may be missed. We
need to understand what alert accuracy is actually needed, and how we'd
validate a model's accuracy before trusting it in production — directly
relevant to the judges' criterion on validating AI results.

We need to answer this now because it shapes both the model tuning
approach and the operational process around alerts (who reviews them,
what happens next).

Constraints:
- No existing baseline data on "normal" animal behavior to train/tune
  against — this may need to be collected first.
- Keeper staff time is limited; alerts compete for attention with other
  duties.

Interested parties: animal welfare/keeper staff, the Countess (animal
health = cost + reputation).

# Options considered

1. **Human-in-the-loop triage** — AI flags candidates, a keeper confirms
   before any action is taken (no fully automated response).
2. **Tiered alert severity** — low-confidence anomalies logged only;
   high-confidence anomalies trigger immediate notification.
3. **Continuous feedback loop** — keepers label alerts as true/false
   positive, feeding back into model retraining over time.
4. **Fixed threshold with periodic manual review** — set a conservative
   threshold initially, review false-positive/negative rates monthly and
   adjust.

# Consequences

- Interview keeper staff: what false-positive rate would they actually
  tolerate before ignoring alerts?
- Prototype a tiered-severity approach on a sample enclosure — does it
  reduce noise without hiding real issues?
- What baseline data do we need to collect before any model can be
  meaningfully tuned, and how long would that take?
- Define what "working" looks like for these alerts before going to
  production — this becomes the acceptance criteria for the eventual
  ADR.
