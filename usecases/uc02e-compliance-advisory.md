# UC02.e - Regulatory & Compliance Advisory with Human-in-Loop (Extended Case — Horizon: 12 months)

> Extended case of [UC02](uc02-animal-health-feeding-monitoring.md).
> Planned now; implementation in the 12-month horizon. Depends on the
> ADR026 advisory machinery and the UC02.b standards corpus landing
> first.

## Overview
The estate answers to animal-welfare, forestry/agriculture, heritage/
historic-building, food-safety, and employment regulation — a body of
obligations currently held in the heads of a few senior staff and a
shelf of binders. As the estate scales 3× and adds flora governance
and public-facing services, "what are we required to do here?" becomes
a daily question this estate cannot staff a compliance desk to answer.
This extended case provides a **staff-facing compliance advisory**:
LLM-assisted answers grounded in the estate's own SOP/governance corpus
**plus the applicable public-domain regulations** (ADR026's grounded-
RAG pattern), always clause-cited, always confidence-labeled, and —
whenever the advice would trigger a real-world action or filing —
**routed through mandatory human confirmation** (ADR007) with the
decision attributed in the audit trail. UC02.d's public-notice
scanning keeps the regulation side of the corpus current.

## Actor(s)
- **Primary:** Duty managers, vet team, groundskeepers, estate
  leadership (askers and confirmers)
- **Secondary:** Compliance/audit (consumer of the advisory's
  attribution trail), UC02.d (regulatory-change feed)

## Goal
Any staff member can get a trustworthy, cited answer to "what does the
regulation and our own governance require in this situation?" — and no
compliance-relevant action is taken on AI advice without an accountable
human decision.

## Trigger
A staff question ("can we run this ride in this wind under our SOP and
the inspection regime?"), a UC02.d regulatory-change alert, an
upcoming inspection, or a planned operational change.

## Preconditions
- ADR026 advisory machinery operational (grounded retrieval, citation,
  confidence, corpus versioning).
- UC02.b standards corpus curated — the estate's own governance half
  of the grounding set.
- UC02.d scanning live — the public-regulation half stays current.
- Roles/permissions (ADR016) restrict who can ask what and who can
  confirm action-triggering advice.

## Main Flow
1. A staff member poses a compliance question against a situation
   (zone, asset, species, activity).
2. The advisory retrieves from the versioned corpus — estate SOPs and
   applicable regulations alike — and answers **with clause-level
   citations and a confidence score**, stating which corpus version it
   answered from.
3. If the answer triggers an action (a closure, a treatment, a filing,
   a husbandry change), it is rendered as a **recommendation requiring
   confirmation** by a role permitted to make that call (ADR007);
   confirmation, rejection, or deferral is attributed in the audit
   trail.
4. Confirmed actions flow into the executing use case (UC02.a
   scheduling, UC02.b care logs, operations).
5. Regulatory changes detected by UC02.d enter the corpus as versioned
   updates; the advisory never answers from superseded clauses without
   saying so.
6. Inspection events draw directly on the corpus + logs + attribution
   trail — the estate's compliance posture becomes a query, not a
   scramble.

## AI Involvement
The advisory is LLM-retrieval-grounded per ADR026 — the estate's most
trust-sensitive internal AI surface, golden-set governed per ADR011
with distinct high-bar categories (animal welfare, public safety,
statutory deadlines) and a specific "superseded regulation" test
class. Provider portability (ADR010) keeps the estate un-locked to any
LLM vendor for a function this load-bearing. **The advisory never
decides; accountable humans do — that is the use case.**

## Alternate / Exception Flows
- **No grounding found (novel situation):** the advisory says so
  explicitly and escalates to human expertise — an honest "I don't
  know" is the correct output, never a confident invention.
- **Corpus conflict (SOP vs. current regulation):** reported as a
  conflict with both clauses cited; resolution is a human governance
  act recorded as a corpus version event.
- **Unpermitted requester:** sensitive categories (statutory filings,
  welfare actions) restricted by role per ADR016.

## Related ADRs
- **ADR026** — Estate Knowledge & Compliance Advisory (the machinery)
- **ADR007** — Alert Validation & False-Positive Tolerance
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR010** — Model & Provider Portability Strategy
- **ADR016** — Visitor & Staff Authentication / Access Control
- **ADR024** — External Data Feed Ingestion (via UC02.d)

## Success Metrics
- % of compliance questions answered with clause-level citations
  (target: 100% of answered questions).
- Confirmed-action attribution completeness in the audit trail.
- Inspection findings: zero attributable to stale guidance or missing
  records.
- Golden-set performance on the high-bar categories, per ADR011
  reporting.

## See Also
- [UC02.b - Flora & Husbandry Standards](uc02b-flora-husbandry-standards-logs.md)
- [UC02.d - Proactive Public-Alert Scanning](uc02d-proactive-public-alert-scanning.md)
- [Extended Use Cases Index](extended-uc-index.md)
