# Timebox

2 days.

# Context

Some AI features — notably animal health alerting — may need to keep
working even when a zone's WiFi is down, since an unwell animal can't
wait for connectivity to return. We need to decide whether inference for
these time-sensitive features runs locally on (or near) the MQTT-capable
devices, or whether store-and-forward to a cloud model is an acceptable
delay.

We need to answer this now because it affects hardware selection/budget
(edge inference needs more capable devices) and the shape of the AI
services layer.

Constraints:
- Same patchy WiFi constraint as spike 001.
- Budget for hardware is finite — edge-capable devices cost more per unit
  than simple sensors.
- Animal welfare is a stated priority; delayed alerts have real cost.

Interested parties: animal welfare team, operations/engineering, the
Countess (cost).

# Options considered

1. **Full edge inference** — lightweight models run directly on gateway
   devices near each enclosure, alerting locally even if offline.
2. **Cloud-only inference with store-and-forward** — raw sensor data is
   queued locally (per spike 001) and inference happens once it reaches
   the cloud; accept a delay during outages.
3. **Hybrid** — simple threshold-based local alerting (e.g. "no movement
   detected in X hours") for the most urgent conditions, with richer
   cloud-based ML for nuanced health/behavior analysis.

# Consequences

- Benchmark a candidate lightweight model on realistic gateway-class
  hardware — is latency and accuracy acceptable?
- What's the cost difference between edge-capable and simple sensor
  hardware at the 55-enclosure scale?
- For the hybrid option, which conditions are urgent enough to need local
  thresholds vs. which can tolerate cloud-inference delay?
- How do we validate that a locally-deployed model doesn't drift out of
  sync with the cloud model over time?
