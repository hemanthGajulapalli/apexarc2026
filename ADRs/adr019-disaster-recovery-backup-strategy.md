# ADR019 - Disaster Recovery & Backup Strategy
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Apply a **tiered backup/recovery strategy** matched to data criticality:
ticketing/payment data (ADR009, via the SaaS vendor) relies on the
vendor's own DR guarantees; the estate's own relational store
(visitor/animal/enclosure reference data) is backed up daily with
point-in-time recovery; time-series telemetry (ADR014) is retained on a
rolling window with lower-cost, less-frequent backup, since individual
sensor readings are lower-stakes than business records if lost.

## Context
Not all data the solution holds is equally critical if lost. Ticketing/
payment records are business-critical and legally sensitive; reference
data (animal/enclosure records) is important but slower-changing;
high-volume telemetry is valuable in aggregate but the loss of any
individual reading is low-impact. A uniform backup strategy would either
over-spend protecting low-stakes data or under-protect critical data.

## Options Considered

### Option 1 (SELECTED): Tiered backup strategy by data criticality
Payment/ticketing data recovery relies on the SaaS vendor's own DR
commitments (verified during procurement per ADR009). The relational
store gets daily backups with point-in-time recovery. Time-series
telemetry uses a rolling retention window with periodic, lower-frequency
backup — losing a few hours of raw sensor data is recoverable in
practice (the animals and rides are still there to re-measure), unlike
losing a payment record.

#### Consequences
* Adopted because: spends backup investment proportionally to actual
  business risk, rather than treating all data as equally critical.
* Adopted because: relying on the ticketing vendor's DR for payment
  data avoids duplicating PCI-scope backup infrastructure the estate
  would otherwise have to build and audit itself.
* Adopted despite: requires the team to actually verify the ticketing
  vendor's DR guarantees during procurement (ADR009) rather than assume
  they're adequate.
* Adopted despite: a telemetry gap during an outage means some
  historical data (e.g. exact popularity counts for that window) can't
  be recovered — acceptable given the low individual-reading stakes.

### Option 2: Uniform, maximal backup for all data
Treat all data (telemetry included) with the same high-frequency,
long-retention backup policy as payment data.

#### Consequences
* Rejected because: disproportionately expensive for high-volume,
  low-individual-stakes telemetry data relative to the actual risk of
  losing it.
* Rejected despite: simplest single policy, no tiering logic to
  maintain.

### Option 3: Minimal/no formal backup strategy
Rely on default cloud platform durability without an explicit DR plan.

#### Consequences
* Rejected because: leaves business-critical reference and payment-
  adjacent data exposed to accidental loss/corruption without a tested
  recovery path — unacceptable for a revenue-generating system.
* Rejected despite: no upfront DR-planning effort.

## Advice
* Actually test the point-in-time recovery process for the relational
  store before go-live, not just document it — an untested backup is
  not a reliable one. - Engineering Lead, Sep 2026

## Supporting Material
* ADR009: Ticketing & Family Pass Architecture
* ADR014: Data Storage Strategy
