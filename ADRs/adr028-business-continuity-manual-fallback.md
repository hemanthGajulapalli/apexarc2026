# ADR028 - Business Continuity via Periodic Continuity Exports and Manual Fallback
* Date: Sep 14, 2026
* Status: PROPOSED

## Decision
Complement ADR019's disaster recovery (getting IT back) with **business
continuity** (running the estate while IT is down). Every
business-critical process gets:

1. A **scheduled continuity export** — a nightly/daily human-readable
   snapshot (email/Excel/PDF) of the data that process needs, dropped to
   both the communication channel and object storage (ADR014's third leg).
2. A documented **manual-fallback SOP** per process — the process runs
   from the latest export plus pre-staged paper forms for the outage
   duration.
3. A **recovery reconciliation SOP** — paper records are scanned and
   batch-entered tagged with the outage window, then reconciled against
   the ADR019 PITR-restored database, with entries logged in the audit
   trail.

Communication is treated as part of the outage surface: if the primary
email/notification provider is down along with everything else, the
runbook switches to a **documented secondary email provider using the
same estate credentials** — a configuration/DNS-level switch, not a code
change.

**Explicit non-goals:** connectivity/network resilience and network-level
fallback are out of scope for this ADR (that is infrastructure DR, not
business process continuity). AI-driven personalization processes
(concierge, personalized offers) are deliberately given no fallback —
they degrade to generic service for the outage duration; this is an
accepted, documented loss.

## Context
ADR019 tiers *backups* by data criticality, which guarantees the data
survives — but a backup does not admit a family through the front gate.
The two objectives have different tolerances: DR can absorb hours of
downtime while systems are restored, but gate admission, keeper rounds,
and feeding schedules cannot pause while IT recovers. Business
continuity is a distinct discipline (SOPs, fallback communication
channels, minimum viable data) that large organizations staff dedicated
teams for; this estate needs the same thinking proportionally.

The planning assumption is deliberately pessimistic: **all systems are
down simultaneously**, including the email/notification provider. Any
fallback design that assumes "at least email works" fails exactly when
it is needed. Periodic pre-positioned exports are the bridge: they move
the minimum data to where humans can use it *before* the outage, so the
outage does not need to be predicted.

## Options Considered

### Option 1 (SELECTED): Periodic continuity exports + per-process manual fallback + reconciliation
Each process's system-of-record tables (see
`other_design_docs/business-continuity-fallback-sop.md` for the full
mapping) are exported on a tiered cadence — nightly for gate
admission/ticketing, daily for feeding/health/ops — to email and object
storage. Each process has a paper-based manual mode that runs off the
latest export. On recovery, paper records are back-filled, tagged with
the outage window, and reconciled against the restored database.

#### Consequences
* Adopted because: it is a read-only derivative of existing data — zero
  impact on the transactional path, and it can be added without touching
  any of the five services (ADR012).
* Adopted because: it spends effort proportionally to "how long can this
  process run blind," mirroring ADR019's tiering logic for backups.
* Adopted because: exports landing in object storage give ADR014's third
  storage leg a concrete, justified job.
* Adopted despite: exports are stale by definition (up to ~24h old) —
  acceptable because manual modes are designed around staleness
  (printed manifests, name-based admission), not around live data.
* Adopted despite: reconciliation is manual labor after every outage and
  depends on staff actually following the paper SOPs.

### Option 2: High-availability / active-active everything
Make every system redundant so continuity never depends on manual modes.

#### Consequences
* Rejected because: cost-prohibitive for a single-site estate and
  contradicts ADR013's managed/serverless-first and the "keep operational
  surface area small" principle — and it still would not cover a total
  provider outage of the communication channel.
* Rejected despite: eliminates the manual-reconciliation labor entirely.

### Option 3: Do nothing beyond ADR019 backups
Rely on backups + restore; accept that the business pauses during
outages.

#### Consequences
* Rejected because: data surviving is not the same as the business
  operating — the gate cannot turn away pre-booked visitors, and animals
  cannot skip feeding cycles while IT is restored.
* Rejected despite: zero additional build effort.

## Advice
* Rehearse before go-live, same discipline as ADR019's "test the PITR
  restore": one tabletop walkthrough plus one paper-mode drill (run the
  gate from the printed manifest for a morning). An untested fallback SOP
  is not a reliable one. - Engineering Lead, Sep 2026
* The reconciliation back-fill must tag every outage-window record so
  loyalty balances, admission counts, and the audit trail stay honest
  after the merge — do not let paper records enter the system
  indistinguishable from live ones. - Engineering Lead, Sep 2026
* Decide explicitly which processes get *no* fallback and say so in the
  SOP (personalization degrades to generic service) — "everything
  continues" is not a continuity plan, it's a wish. - Engineering Lead,
  Sep 2026

## Supporting Material
* [Business Continuity & Manual Fallback SOP](../other_design_docs/business-continuity-fallback-sop.md) — process-by-process mapping, communication runbook, reconciliation procedure
* ADR019: Disaster Recovery & Backup Strategy
* ADR012: Overall System Architecture Style
* ADR014: Data Storage Strategy
* ADR009: Ticketing & Family Pass Architecture
