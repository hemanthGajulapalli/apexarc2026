# ADR010 - Model & Provider Portability Strategy
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Build a **thin abstraction layer over a standard API shape** for all AI
features (vision counting, anomaly detection, any future conversational
AI), so switching model/provider means changing a config/adapter rather
than rewriting feature code. Where feasible for lower-stakes features
(e.g. anomaly detection thres/ classification), prefer **open,
self-hostable models** so the estate isn't fully dependent on any single
vendor relationship continuing.

## Context
AI technology and providers are changing fast; the brief explicitly asks
how the solution would handle a provider raising prices or shutting
down. The estate has multiple distinct AI use cases that may not all
carry the same portability risk, and the team has limited time to build
a full multi-provider setup for everything.

## Options Considered

### Option 1 (SELECTED): Abstraction layer + open models where feasible
All AI feature code calls a common internal interface; a
config-selected adapter translates to whichever provider/model is
active. For lower-stakes, well-bounded tasks (anomaly detection,
simple classification), default to open/self-hostable models the estate
could run on its own infrastructure if needed; reserve commercial
provider APIs for tasks that genuinely need frontier-model capability
(e.g. richer vision tasks, any conversational features).

#### Consequences
* Adopted because: a config-level provider swap is far cheaper than a
  code rewrite if a vendor's pricing or availability changes —
  addresses the brief's explicit concern directly.
* Adopted because: open models for lower-stakes tasks reduce
  vendor-shutdown risk exactly where the estate is least able to
  tolerate a sudden gap (ongoing animal monitoring).
* Adopted despite: the abstraction layer adds a small amount of
  ongoing engineering overhead (interface maintenance, adapter testing
  per provider) compared to calling one vendor's SDK directly.
* Adopted despite: open models may lag commercial frontier models in
  raw capability — acceptable for narrow, well-bounded tasks, but not
  assumed to be a universal substitute.

### Option 2: Multi-provider from day one (active redundancy)
Run two providers concurrently for critical features.

#### Consequences
* Rejected because: doubles operational cost and complexity for
  redundancy the estate likely doesn't need on day one; premature given
  the estate hasn't yet validated which features are truly critical.
* Rejected despite: maximal resilience against a single provider
  failure.

### Option 3: Accept lock-in, document exit plan only
Pick a provider pragmatically now, write down a migration plan in an
ADR, revisit later without building abstraction now.

#### Consequences
* Rejected because: a documented-but-unbuilt exit plan still requires a
  full rewrite when the time comes — it reduces planning risk but not
  actual migration cost or time-to-recover from a provider event.
* Rejected despite: fastest to build initially, avoids any abstraction
  overhead.

## Advice
* Validate the abstraction layer early by actually swapping providers
  for one feature in a lower-stakes environment before relying on it for
  production animal-welfare features. - Engineering Lead, Sep 2026

## Supporting Material
* Spike 010: Model/provider portability
