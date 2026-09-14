# Business Continuity & Manual Fallback SOP

## Overview

This document operationalizes [ADR028](../ADRs/adr028-business-continuity-manual-fallback.md).
ADR019's backups guarantee the *data* survives an outage; this SOP
guarantees the *business* keeps operating while it does. It covers three
things: (1) the periodic continuity exports that pre-position minimum
viable data where humans can reach it, (2) the per-process manual
fallback modes that run off those exports plus paper, and (3) the
reconciliation that merges paper records back into the restored system
honestly.

### Scope and assumptions

* **The planning assumption is total outage**: all IT systems are down
  simultaneously — estate services, cloud platform, ticketing SaaS, *and
  the primary email/notification provider*. No fallback in this document
  may depend on "at least X is still up."
* **Out of scope:** connectivity/network resilience and network-level
  fallback (link redundancy, failover circuits). This is an IT-systems
  and business-process continuity plan, not an infrastructure DR plan —
  infrastructure recovery is ADR019's job.
* Continuity exports are read-only derivatives. They never write back,
  so they cannot corrupt the transactional path.

### Communication fallback runbook

When the outage includes the email/notification provider:

1. **Declare the outage** and activate this SOP (whoever detects it —
   Operations or Admin role per ADR016 RBAC).
2. **Switch communication to the documented secondary email provider.**
   The estate's sending identity (domain, credentials) is registered
   with a secondary provider in advance, so the switch is a
   configuration/DNS-level change using the **same credentials** — not a
   procurement or code change. This is why continuity exports survive
   even a provider outage.
3. **Belt and braces:** every continuity export is also dropped to
   object storage (ADR014's third storage leg) at the same cadence, so
   the latest manifests exist even while email is being switched.
4. If both providers are unreachable, proceed on printed manifests only
   (step 3 covers this) and use out-of-band channels (phone/SMS tree)
   for staff notification — the staff contact tree is part of the
   pre-staged paper pack.

### Process-by-process fallback mapping

| Process | System of record (`implementation/db/schema.sql`) | Export cadence | Manual fallback mode |
|---|---|---|---|
| Gate admission / ticketing | `tickets`, `ticket_entries`, `loyalty_accounts` | Nightly | Gate operates from the printed booking manifest (names, ticket IDs, loyalty balances); visitors admitted by name/ID match; paper stubs collected per entry |
| Bookings / events | `tickets` + booking metadata | Nightly | Admit from the Excel manifest; new walk-ins recorded on pre-staged paper forms |
| Keeper rounds / feeding | `feeding_logs`, `staff_assignments`, `zones`, `enclosures` | Daily | Paper checklists per enclosure from the printed assignment/schedule roster |
| Animal health | `alerts`, `treatments` | Daily | Vet works from the printed open-alerts list; new cases triaged on paper against the active-treatment export |
| Population census (UC03) | `population_counts` | Latest count per enclosure | Manual tally sheets — this process is already near-manual by design (ADR006) |
| Ops staffing (UC01) | `popularity_forecasts`, `popularity_aggregates_daily` | Daily | Ops runs to the pre-printed forecast + staffing recommendation; stale but directionally useful |
| Concierge / personalization (UC04) | `personalized_offers`, `concierge_queries` | None | **Accepted loss — no fallback.** Service degrades to generic; stated explicitly rather than improvised |

### Tiering: how long can each process run blind?

Mirrors ADR019's logic — continuity effort proportional to tolerance:

* **Nightly export (gate/ticketing):** least tolerant — revenue and legal
  record; must survive at least a full day of outage without loss of
  admission capability.
* **Daily export (feeding, health, ops):** a day of staleness is
  tolerable; yesterday's schedule is essentially today's.
* **Latest-snapshot (census):** counts are periodic by design; the last
  recorded count plus manual tallies bridges the outage.
* **No export (personalization):** no fallback; degradation accepted by
  ADR028 decision.

### Recovery reconciliation SOP

1. **Restore** per ADR019 (including the tested PITR restore).
2. **Scan/photo all paper artifacts** — gate stubs, walk-in forms,
   feeding checklists, vet triage sheets, census tallies.
3. **Batch-enter** every record tagged with the outage window so nothing
   enters the system indistinguishable from live data.
4. **Reconcile** outage-window entries against the restored database:
   admissions vs. manifest, loyalty point accruals, new walk-in tickets —
   resolving double-admissions and missed scans.
5. **Log** the reconciliation in `audit_log` (who entered what, from
   which paper source, for which outage window).

### Rehearsal requirement

Same discipline as ADR019's "test the PITR restore before go-live":

* One **tabletop walkthrough** of this SOP with gate, keeper, and ops
  leads before go-live.
* One **paper-mode drill**: run the front gate from the printed manifest
  for a morning, then exercise the reconciliation step — including
  deliberately introducing one duplicate and one missed scan to confirm
  reconciliation catches them.

### Pre-staged materials checklist

* Daily printed booking/manifest pack at the gate office.
* Paper form templates: walk-in booking, feeding checklist, vet triage,
  census tally.
* Staff phone/SMS contact tree.
* Secondary email provider registration (same credentials) verified
  quarterly.
