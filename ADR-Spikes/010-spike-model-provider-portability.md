# Timebox

2 days.

# Context

AI technology and providers are changing fast. The brief explicitly asks
how the solution deals with a provider changing prices or shutting down.
We need to understand what it takes to build the architecture so that
swapping the underlying model/provider (for popularity analytics, animal
monitoring, or any visitor-facing AI feature) doesn't require a rebuild.

We need to answer this now because it's an explicit judging criterion
("dealing with uncertainty in AI technology"), and retrofitting
portability after committing to a provider-specific integration is much
more expensive than designing for it upfront.

Constraints:
- Multiple distinct AI use cases (vision, anomaly detection, possibly
  conversational AI) may not all have the same portability story.
- Team likely has limited time to build/maintain a full abstraction
  layer — the solution needs to be pragmatic, not gold-plated.

Interested parties: engineering team, the Countess (cost/risk exposure).

# Options considered

1. **Abstraction layer over a standard API shape** — build AI features
   against a common interface (e.g. OpenAI-compatible or similar), so
   swapping providers means changing a config/adapter, not rewriting
   features.
2. **Multi-provider from day one** — actively run two providers for
   critical features to avoid any single point of failure.
3. **Accept lock-in for now, document the exit plan** — pick a provider
   pragmatically, but write down (in an ADR) what a migration would
   involve and estimate the effort, revisiting later.
4. **Prefer open, self-hostable models where feasible** — for
   lower-stakes features (e.g. anomaly detection), use open models the
   estate could run itself if a vendor relationship ends.

# Consequences

- Prototype swapping the model/provider behind the abstraction layer for
  one feature — how much code actually needs to change?
- Does an abstraction layer add meaningful latency/complexity cost for
  the estate's scale, or is that overhead negligible?
- For which of the estate's AI use cases (vision, anomaly detection,
  chat) is provider lock-in riskiest, and does the strategy need to
  differ per use case?
- Document findings as an ADR — this decision should be explicit and
  justified, not just defaulted to whichever provider is easiest today.
