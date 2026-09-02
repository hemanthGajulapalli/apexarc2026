# ADR018 - Visitor Data Privacy & Governance
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Apply **data minimization and aggregation-by-default** across all
visitor-related data collection: presence-sensing data (ADR003) is
processed into aggregate zone counts and discarded at the individual
level as soon as aggregation completes; no persistent visitor-level
location history is retained beyond what the ticketing platform
(ADR009) already holds for account/purchase purposes. A single
documented data-retention policy governs all visitor data across
services.

## Context
The popularity-tracking approach (ADR003) includes BLE presence sensing
in select zones, which involves detecting visitor devices. Combined
with ticketing (ADR009) and any future personalization (ADR008), the
estate is collecting several kinds of visitor-related data. This needs
a consistent, defensible governance approach rather than each feature
deciding its own retention/privacy rules independently.

## Options Considered

### Option 1 (SELECTED): Data minimization + aggregation-by-default + single retention policy
BLE presence data is aggregated into zone-level counts in near-real-time
and individual device identifiers are not persisted beyond that
aggregation step. Any visitor-level data that must be retained (e.g.
ticketing/account history) follows one documented, estate-wide
retention policy rather than per-feature ad hoc rules.

#### Consequences
* Adopted because: minimizes privacy risk and regulatory exposure by
  simply not retaining sensitive individual-level data longer than
  needed to produce the aggregate the business actually needs.
* Adopted because: a single retention policy is easier to explain to
  visitors and regulators, and easier for the team to implement
  consistently, than per-feature rules.
* Adopted despite: aggregation-by-default limits future flexibility —
  e.g. if a later feature wanted individual-level dwell-time analysis,
  that data won't exist retroactively.
* Adopted despite: requires a documented policy and a designated owner
  to keep it enforced as new features (e.g. ADR008's future
  personalization) are added.

### Option 2: Retain full individual-level data for future flexibility
Keep raw presence/location data indefinitely in case future features
need it.

#### Consequences
* Rejected because: significantly increases privacy risk and regulatory
  exposure for speculative future value, and works against visitor
  trust if disclosed.
* Rejected despite: maximum flexibility for future personalization or
  analytics features.

### Option 3: No formal governance — each feature decides independently
Leave retention/privacy decisions to whichever team builds each feature.

#### Consequences
* Rejected because: risks inconsistent, hard-to-audit practices across
  features and a weaker position if ever challenged on privacy grounds.
* Rejected despite: no upfront policy-writing effort required.

## Advice
* Have this policy reviewed against applicable regional privacy
  regulation (data collection is happening in a physical public venue,
  which has its own signage/consent considerations distinct from
  online-only services) before BLE sensing goes live. - Operations
  Lead, Sep 2026

## Supporting Material
* ADR003: Visitor Popularity Tracking Method
* ADR008: Returning Visitor Growth Mechanism
* ADR009: Ticketing & Family Pass Architecture
