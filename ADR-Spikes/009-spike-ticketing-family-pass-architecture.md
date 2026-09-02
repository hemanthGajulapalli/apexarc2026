# Timebox

2 days.

# Context

The estate needs a system for visitors to buy tickets, including family
passes. This is a foundational, largely well-understood problem (unlike
the AI-heavy parts of the brief), but we still need to decide how it
integrates with the popularity-analytics pipeline (spike 003) and
whether to build vs. buy.

We need to answer this now because ticketing is the entry point for
visitor data used elsewhere (popularity tracking, future personalization
in spike 008), so its architecture constrains those downstream features.

Constraints:
- Needs to support family passes (multi-person, possibly multi-visit).
- Should integrate with popularity tracking (spike 003) without becoming
  a bottleneck.
- Budget/time — this isn't the estate's core differentiator, so
  over-building it isn't a good use of resources.

Interested parties: the Countess (revenue), visitors (ease of purchase),
operations (gate throughput).

# Options considered

1. **Off-the-shelf ticketing SaaS platform** — integrate a third-party
   ticketing product with an API/webhook feed into our analytics
   pipeline.
2. **Custom-built ticketing service** — bespoke system fully owned and
   integrated with the rest of the architecture.
3. **Hybrid** — off-the-shelf for payment/purchase flow, custom
   integration layer that feeds gate-scan events into our own analytics
   pipeline.

# Consequences

- Compare cost and integration effort of a few candidate SaaS platforms
  against build-from-scratch effort.
- Does the chosen platform support the data export/webhook granularity
  needed for the popularity-analytics use case (spike 003/004)?
- How does family-pass logic (shared entry, multiple visits) affect
  per-visitor popularity attribution?
- What's the gate-side hardware requirement (scanners, connectivity) and
  does it fit the same patchy-WiFi constraints as everything else
  (spike 001)?
