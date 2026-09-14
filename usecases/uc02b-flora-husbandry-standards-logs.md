# UC02.b - Flora & Husbandry Standards, Governance, Maintenance Logs & Seasonal/Daily Predictions (Extended Case — Horizon: 6–12 months)

> Extended case of [UC02](uc02-animal-health-feeding-monitoring.md)
> (extends the monitoring/guardrail pattern from fauna to the whole
> living collection — flora included).
> Planned now; implementation in the 6–12 month horizon.

## Overview
The estate's living collection has always been more than animals — the
grounds, historic gardens, and tree stock are a monetizable asset and
a regulatory subject in their own right — but husbandry practice for
the animal collection has outpaced any equivalent for flora, and both
rely on tribal knowledge. This extended case establishes:

1. **Standards & SOPs as governed documents:** species-tiered animal
   husbandry standards (extending UC02's tiers) and plant/grounds
   care standards, versioned in a curated corpus (per ADR026) rather
   than binders.
2. **Maintenance logs:** structured, auditable care records — feeding,
   treatment, pruning, soil work, inspection — attached to enclosures
   and grounds zones, meeting the standards the applicable forestry/
   agriculture and animal-welfare authorities expect.
3. **Seasonal & daily predictions:** LLM-assisted (weather-grounded,
   ADR024 feeds) predictions of care needs — seasonal prep calendars
   per species/planting, and day-ahead adjustments from the weather
   trajectory ("heat spike → shade/watering priorities; frost warning
   → sensitive beds tonight").

Every AI-suggested care action follows the estate's core guardrail:
**recommend, then a human confirms** (ADR007), and every advisory
cites the SOP/regulation clause it rests on (ADR026).

## Actor(s)
- **Primary:** Keepers (fauna), groundskeepers (flora), vet team
- **Secondary:** Estate leadership (compliance posture), regulators/
  inspectors (audit consumers of the logs)

## Goal
Every animal and planting on the estate is cared for to a written,
versioned standard; care is logged auditably; tomorrow's care
priorities are predicted from weather and season before problems
appear.

## Trigger
A scheduled care cycle, a keeper/groundskeeper logging completed work,
a weather-driven daily prediction, or a seasonal planning cycle.

## Preconditions
- Standards corpus curated and versioned (ADR026) — the critical-path
  data work of this UC.
- Weather feeds flowing (ADR024, landed first via UC01.b).
- UC02's species-tier model extended with flora zones/tiers.

## Main Flow
1. Staff consult the advisory for "what does the standard require
   here?" — answers are clause-cited, confidence-labeled (ADR026).
2. Care actions are logged as structured records per enclosure/
   grounds zone — who, what, when, per which standard — replacing
   paper logs with an inspection-ready audit trail.
3. The **daily prediction** runs each morning: weather forecast +
   season + species/planting profiles → prioritized care
   recommendations per zone ("sensitive beds need frost cover
   tonight; reptile tier feeding offsets for cold snap").
4. The **seasonal prediction** projects weeks ahead: prep calendars,
   pruning/inspection windows, husbandry adjustments.
5. Predictions are recommend-only: a human assigns/schedules the
   work (into UC02.a's maintenance scheduling when asset-related).
6. Deviations from standard (logged care not matching SOP, missed
   cycles) surface as alerts — tiered per ADR007, confirmed/dismissed
   by accountable staff like UC02's health alerts.

## AI Involvement
Weather-grounded care prediction is LLM/ML-assisted but grounded in
the versioned standards corpus and structured logs — the ADR026
grounded-RAG pattern with ADR011 golden-set verification. Care
predictions that touch animal welfare or protected plantings are the
high-bar golden-set category. The prediction never executes; staffing
the recommendation is a human decision per shift.

## Alternate / Exception Flows
- **Severe weather incoming:** predictions escalate to operations
  alongside UC02.d public-alert scanning; protective actions are human-
  approved and logged.
- **Standard conflict (SOP vs. regulation):** advisory reports the
  conflict and cites both — conflict resolution is a human governance
  act, recorded as a corpus version event.
- **Missed care window:** alert with tiered severity; repeat misses
  escalate to leadership reporting (UC01.c).

## Related ADRs
- **ADR026** — Estate Knowledge & Compliance Advisory
- **ADR024** — External Data Feed Ingestion (weather)
- **ADR005** — Animal Health & Feeding Monitoring (species tiers)
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR014** — Data Storage Strategy (audit/log storage)

## Success Metrics
- % of care actions logged to standard (audit-ready coverage).
- Prediction lead time on weather-driven care needs (hours/days ahead,
  measured against actual events).
- Zero audit findings attributable to missing records or stale
  standards.

## See Also
- [UC02 - Animal Health & Feeding Monitoring](uc02-animal-health-feeding-monitoring.md)
- [UC02.a - Maintenance & Repair Scheduling](uc02a-maintenance-repair-scheduling.md)
- [Extended Use Cases Index](extended-uc-index.md)
