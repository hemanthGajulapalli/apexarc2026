# UC02.d - Proactive Public-Alert Scanning & Decision-Maker Notification (Extended Case — Horizon: 6–12 months)

> Extended case of [UC02](uc02-animal-health-feeding-monitoring.md)
> (extends the alert pipeline from estate sensors to the public
> domain).
> Planned now; implementation in the 6–12 month horizon.

## Overview
Risks to the estate often announce themselves publicly before they
arrive: a severe-weather warning, a regional animal-disease notice, a
road closure on the access route, a regulatory consultation affecting
the estate, a media story that will hit ticket sales. Today someone
has to happen to see these. This extended case runs a **continuous
simulating scan of public-domain sources** — official weather and
environment-agency alerts, government/agency notices, local-authority
announcements, news — via ADR024 provenance-tracked pull-jobs, and
raises **proactive alerts to decision-makers** ("wind warning: review
ride/enclosure exposure", "snow forecast: close upper grounds route")
with the estate's standard human-confirmation guardrail: the scan
alerts, a human decides and acts.

## Actor(s)
- **Primary:** Operations leadership, the Countess (decision-makers
  receiving alerts), duty managers (acting on them)
- **Secondary:** UC02.b (weather-driven care actions), UC01.b
  (weather-aware forecasting shares the feed)

## Goal
No publicly-announced risk reaches the estate as a surprise; every
material public notice reaches an accountable decision-maker with
enough lead time to act.

## Trigger
A scheduled scan cycle (poll every N minutes — "continuous" as a
simulated cadence, not an always-on connection, per ADR024).

## Preconditions
- Source list curated and reviewable: which official feeds, agencies,
  and news sources are in scope (governance-owned, not ad hoc).
- ADR024 feed mechanism operational with archived copies of what each
  source said at fetch time (compliance-relevant alerts must be
  reproducible).
- Notification path to decision-makers defined (ADR007's notification
  policy; ADR017 observability when built).

## Main Flow
1. Scheduled pull-jobs scan registered public sources; each fetched
   notice is archived with source + fetch-time provenance.
2. Classification assigns each item: relevance (estate-affecting?),
   category (weather/safety/regulatory/reputation/access), urgency,
   and — where possible — the estate entities affected (rides,
   enclosures, routes, zones).
3. Relevant items become alerts with tiered severity per ADR007:
   high-urgency/severe-weather → immediate decision-maker
   notification; lower tiers → digest/log.
4. Alerts carry **suggested actions grounded in estate standards**
   (via ADR026: "per SOP X, wind above Y closes rides A/B") —
   suggestions only; the duty human decides, and the decision is
   attributed in the audit trail.
5. Confirmed actions flow into the systems that execute them: UC02.a
   (asset closures → availability feed), UC02.b (protective care
   actions), operations rosters.
6. The alert history becomes labeled verification data — which alerts
   mattered, which were noise (the ADR007 feedback loop).

## AI Involvement
Classification/relevance-scanning is AI-assisted and golden-set
governed (ADR011), with missed-severe-alert as the highest-bar failure
category — a false negative on a storm warning costs more than many
false positives, so severity thresholds are deliberately biased
toward over-alerting (ADR007's tolerance asymmetry). LLM drafting of
suggested actions follows ADR026 grounding (cite the SOP/regulation
or don't suggest).

## Alternate / Exception Flows
- **Source unavailable/changed:** the scan marks the source as
  degraded and reports coverage gaps to governance — a silently
  un-scanned source is a hidden blind spot, worse than a known one.
- **Alert storm (widespread regional event):** deduplication and
  digest mode prevent decision-maker overload exactly when attention
  is scarcest.
- **Ambiguous relevance:** low-confidence items queue for human
  triage in the digest rather than paging anyone.

## Related ADRs
- **ADR024** — External Data Feed Ingestion
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR026** — Estate Knowledge & Compliance Advisory
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR017** — Observability & Monitoring Infrastructure

## Success Metrics
- Lead time from public notice to decision-maker alert (target:
  minutes for severe weather).
- Missed-material-alert rate: zero tolerance, measured in golden-set
  and production review.
- Alert precision trending up via the confirm/dismiss feedback loop
  without ever trading away the severe-alert bias.

## See Also
- [UC02.b - Flora & Husbandry Standards](uc02b-flora-husbandry-standards-logs.md)
- [UC01.b - Weather-Based Visibility Forecast](uc01b-weather-based-visibility-forecast.md)
- [Extended Use Cases Index](extended-uc-index.md)
