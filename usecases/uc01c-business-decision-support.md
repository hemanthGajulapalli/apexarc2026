# UC01.c - Business Decision Support: Estate Data + Public Sentiment (Extended Case — Horizon: 12–24 months)

> Extended case of [UC01](uc01-visitor-popularity-analytics.md).
> Planned now; implementation in the 12–24 month horizon.

## Overview
Leadership decisions at the estate — investment, pricing posture,
program changes, expansion priorities — currently rest on UC01/UC02
operational data alone. Two decision inputs are missing: **public
business sentiment** (reviews, social commentary, press about the
estate and comparable attractions, from the public domain) and
**cross-domain synthesis** of the estate's own accumulated behavioral
data (sensor popularity, occupancy, spend, and the human feedback the
confirm/dismiss loops have been generating since launch). This
extended case adds a decision-support layer that joins estate data
with provenance-tracked public-domain sentiment (ADR024 pull-jobs) and
produces **recommend-then-approve insight reports** for the Countess
and operations leadership — grounded, cited, and always ending in a
human decision, never an automated one.

## Actor(s)
- **Primary:** The Countess and operations leadership (decision
  consumers)
- **Secondary:** Data/AI governance (ADR011 verification of the
  synthesis models)

## Goal
Give decision-makers evidence-backed answers to strategic questions —
"what do visitors love/hate, what does our own data say, where should
the next investment go" — with every claim traceable to estate records
or cited public sources.

## Trigger
Scheduled report/insight generation (weekly/monthly cycle), or an
ad-hoc leadership question routed through the advisory surface.

## Preconditions
- ADR024 external feed mechanism operational (public sentiment is the
  second feed type after weather).
- Sustained UC01/UC02/UC01.a data history — synthesis is only as good
  as the underlying record.
- ADR018 privacy posture: only aggregated, anonymized estate data
  feeds sentiment synthesis; no individual-level data, ever.

## Main Flow
1. Public-domain sentiment pull-jobs collect reviews/commentary about
   the estate (and comparables) on schedule; archived with provenance
   (what the source said *at fetch time*).
2. Sentiment is classified and theme-mapped to estate entities (zones,
   rides, exhibits, services) — matching public commentary to the
   estate's own zone/analytics identifiers.
3. The synthesis model joins sentiment themes with estate behavioral
   data (popularity aggregates, occupancy, UC02 human-feedback
   labels) to produce insight candidates ("complaints about queues at
   zone X correlate with our occupancy data showing sustained full
   status; UC01.a alerts confirm").
4. Insights are rendered as cited reports — every estate claim links
   to aggregates, every public claim links to archived sources.
5. Recommendations enter the existing recommend-then-approve flow
   (ADR021 pattern); leadership approves, rejects, or defers with
   attribution in the audit trail.

## AI Involvement
Sentiment classification and cross-domain synthesis are AI core —
golden-set verified per ADR011 with specific attention to sentiment
model drift (public language and platforms shift). LLM-generated
report prose follows ADR022 grounding discipline. **The model never
decides; it evidences.** Public-domain sentiment carries source-quality
weighting — one viral post is not a trend.

## Alternate / Exception Flows
- **Sentiment feed degraded/changed (site redesign, API change):**
  feed marks data-gap periods explicitly; reports exclude rather than
  interpolate gapped periods.
- **Contradiction between sentiment and estate data:** reported as a
  finding, not resolved silently — contradictions are often the most
  valuable insights ("guests say X, sensors say Y").
- **Low-volume periods:** reports state confidence; sparse-data
  conclusions are suppressed rather than inflated.

## Related ADRs
- **ADR024** — External Data Feed Ingestion
- **ADR021** — Popularity Forecasting & Recommendations (approval flow)
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR018** — Visitor Data Privacy & Governance
- **ADR007** — Alert Validation & False-Positive Tolerance

## Success Metrics
- % of leadership investment decisions accompanied by a cited
  decision-support report.
- Golden-set accuracy of sentiment-to-entity mapping.
- Zero individual-level data usage in any synthesis (ADR018 audit).

## See Also
- [UC01 - Visitor Popularity Analytics](uc01-visitor-popularity-analytics.md)
- [Extended Use Cases Index](extended-uc-index.md)
