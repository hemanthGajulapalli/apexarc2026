# ADR017 - Observability & Monitoring Infrastructure
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Adopt a **single managed observability stack** (logs, metrics, traces)
shared across all services (ADR012), using the cloud platform's native
offering (ADR013) rather than standing up a separate self-managed
observability tool. AI-specific monitoring (drift detection, alert
feedback per ADR011) is built as an additional layer on top of this
shared stack, not a separate system.

## Context
The event-driven, multi-service architecture (ADR012) makes end-to-end
debugging harder than a monolith would be — a single visitor-facing
issue could span ingestion, analytics, and AI inference services. The
team also needs the AI-specific monitoring described in ADR011, which
should build on general system observability rather than duplicate it.

## Options Considered

### Option 1 (SELECTED): Shared managed observability stack, AI monitoring layered on top
Use the cloud platform's native logging/metrics/tracing service across
all services. Instrument event flows (per ADR012) with correlation IDs
so a single event (e.g. one sensor reading) can be traced across
services. AI-specific signals (alert confidence, drift metrics per
ADR011) are emitted as additional metrics into the same system.

#### Consequences
* Adopted because: one place for the team to look regardless of which
  service is implicated, reducing debugging time in an event-driven
  system that could otherwise be hard to trace.
* Adopted because: reusing the cloud platform's native tooling avoids
  standing up and operating a separate observability product.
* Adopted despite: ties observability tooling to the chosen cloud
  platform (ADR013) — a future cloud migration would need to include an
  observability migration too.

### Option 2: Separate best-of-breed observability tool
Adopt a dedicated third-party observability product independent of the
cloud platform.

#### Consequences
* Rejected because: adds another vendor relationship and integration
  surface for marginal benefit at the estate's current scale — the
  cloud platform's native tooling is sufficient.
* Rejected despite: potentially richer features/UX than a cloud
  provider's built-in offering.

### Option 3: No dedicated observability investment — logs only, per service
Each service manages its own basic logging with no unified view or
tracing.

#### Consequences
* Rejected because: makes cross-service debugging in an event-driven
  architecture (ADR012) impractical, and undermines the AI verification
  strategy (ADR011), which depends on being able to see drift and
  feedback signals in one place.
* Rejected despite: lowest initial setup cost.

## Advice
* Instrument correlation IDs from day one, even before the full
  dashboard/alerting layer is built — retrofitting tracing into an
  already-running event-driven system is much harder than building it
  in from the start. - Engineering Lead, Sep 2026

## Supporting Material
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR012: Overall System Architecture Style
* ADR013: Cloud Platform Selection
