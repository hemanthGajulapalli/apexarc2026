# UC02.c - Satellite Flora & Grounds Monitoring (Extended Case — Horizon: 24 months)

> Extended case of [UC02](uc02-animal-health-feeding-monitoring.md).
> Planned now; implementation in the 24-month horizon (the longest-
> lead extended case — commercial subscription, not leased hardware).

## Overview
The estate's grounds are large enough that groundskeeper observation
cannot cover them all, and problems — tree stress, disease spread,
waterlogging, unlicensed clearing at the boundary — show in vegetation
patterns before they show on foot. This extended case subscribes to
**commercial satellite imagery feeds** (a data subscription — no
leased satellite, no estate-owned hardware) and processes them on a
**nightly or day-spread job schedule** (ADR024 batch pull posture —
"highly cohesive moving machine" over the grounds) with AI/LLM-assisted
analysis to flag flora stress and grounds-maintenance needs. Analysis
standards are **tailored to the forestry/agriculture departments'
standards applicable to the estate's region**, and every flagged
finding routes through the estate's human-confirmation guardrail
before any work order (UC02.a) is raised.

## Actor(s)
- **Primary:** Groundskeepers/head gardener (finding consumers),
  estate leadership (boundary/intrusion awareness)
- **Secondary:** UC02.a maintenance scheduling (work orders),
  UC02.b standards corpus (analysis baselines)

## Goal
Estate-wide vegetation and grounds visibility on a regular cadence
without staffing every hectare — catching stress, disease, and
intrusion early enough for cheap intervention instead of expensive
remediation.

## Trigger
A scheduled satellite-feed delivery (nightly or per the subscription's
delivery windows, pulled via ADR024).

## Preconditions
- Commercial imagery subscription contracted (costed in the cost-
  analysis doc **before** contracting — first recurring external data
  purchase; ADR024 advice).
- ADR024 feed ingestion operational and proven-hardened on weather
  (UC01.b) and public-notice (UC02.d) feeds.
- Regional forestry/agriculture standards mapped into the analysis
  baseline (feeds UC02.b's corpus).
- Object storage available for imagery artifacts — the ADR014
  object-storage seam (`capture_object_key` pattern), currently the
  implementation's documented gap; landing this UC closes that gap.

## Main Flow
1. The subscription delivers imagery on its published windows; the
   ADR024 pull-job ingests each delivery with full provenance.
2. Scheduled jobs (nightly, or spread across the day per delivery
   cadence) run analysis: vegetation indices, change detection vs.
   prior passes, stress/disease-pattern signatures, boundary-change
   detection.
3. Findings are scored and mapped to grounds zones; analysis is
   tailored to the applicable regional forestry/agriculture standards
   so findings speak the inspectors' language ("stress pattern
   consistent with [standard's] category X").
4. LLM-assisted narrative explains each finding with citations to the
   imagery pass and the standards clause (ADR026 grounding discipline).
5. Confirmed findings → human review → work orders in UC02.a's
   scheduling; dismissed findings become labeled training/verification
   data (the UC02 confirm/dismiss loop, ADR007).
6. Time-series of passes accumulates into a grounds-health history —
   feeding UC01.c decision support on grounds investment.

## AI Involvement
Vision models for vegetation/change analysis plus LLM-assisted
narration — both golden-set/drift-governed per ADR011. False-positive
tolerance follows ADR007: low-confidence findings log-only; actioned
findings require human confirmation. Model provider portability
(ADR010) matters here — imagery-analysis vendors are exactly the kind
of dependency the estate should be able to swap.

## Alternate / Exception Flows
- **Missed delivery (weather-blocked capture, vendor outage):** jobs
  skip the pass and record the gap; analysis compares against the last
  valid baseline with the gap explicitly noted.
- **Seasonal false positives (autumn color, managed felling):**
  baseline calendars and labeled history suppress known-seasonal
  signatures; novel changes still surface.
- **Boundary finding (possible intrusion/encroachment):** escalates
  beyond grounds staff to estate leadership and, where applicable,
  authorities — a human legal decision, never automated.

## Related ADRs
- **ADR024** — External Data Feed Ingestion
- **ADR014** — Data Storage Strategy (object storage seam)
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR010** — Model & Provider Portability Strategy
- **ADR026** — Estate Knowledge & Compliance Advisory

## Success Metrics
- Grounds coverage per analysis cycle (target: 100% of estate area).
- Detection lead time on flora stress events vs. foot-discovery
  baseline.
- False-positive rate after confirmation-loop labeling, trending down.
- Cost per hectare monitored vs. staffing-equivalent (the UC's
  raison d'être).

## See Also
- [UC02.b - Flora & Husbandry Standards](uc02b-flora-husbandry-standards-logs.md)
- [UC02.a - Maintenance & Repair Scheduling](uc02a-maintenance-repair-scheduling.md)
- [Extended Use Cases Index](extended-uc-index.md)
