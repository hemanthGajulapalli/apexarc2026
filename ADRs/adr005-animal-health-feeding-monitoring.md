# ADR005 - Animal Health & Feeding Monitoring Approach
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use a **species-tiered monitoring approach**: a small number of
monitoring "profiles" (e.g. mammals, reptiles/land, aquatic), each with a
standard sensor kit and a shared anomaly-detection model per tier, rather
than fully bespoke per-enclosure builds or a single one-size-fits-all
model. Pair this with **keeper-reported data capture** (feeding amounts,
behavior notes) as a first-class input to the models, not just raw
sensor telemetry.

## Context
The estate needs to track animal health and feeding across 200+ animals
in 55 displays/enclosures — a highly diverse collection. Fully bespoke
per-species monitoring is the most accurate option but is not
cost-effective at this scale; a single generic model risks being
accurate for none of the very different species involved.

## Options Considered

### Option 1 (SELECTED): Species-tiered profiles + keeper-reported data
Group the 55 enclosures into a handful of tiers by species type. Each
tier gets a standard sensor kit (weight, motion/activity, feeding-station
trigger) and a shared anomaly-detection model tuned to that tier's normal
baseline. Keeper-logged feeding/behavior notes feed into the same model
as an additional, often more reliable, signal.

#### Consequences
* Adopted because: balances cost (reusing sensor kits and models across
  a tier) against accuracy (tiers are narrow enough that "normal" is
  meaningfully defined per tier).
* Adopted because: keeper-reported data is cheap to add, already
  trusted by staff, and gives the model ground-truth-adjacent signal
  that pure sensors can't (e.g. "ate less than usual today").
* Adopted despite: tier boundaries will need periodic review — some
  species may not fit cleanly into a standard tier and need manual
  exception handling.
* Adopted despite: less accurate per-species than a fully bespoke model
  would be; the estate accepts this trade-off for affordability.

### Option 2: Fully bespoke per-species monitoring
Custom sensor and model setup for each of the 55 enclosures.

#### Consequences
* Rejected because: cost and engineering effort scale linearly with
  enclosure count, which isn't sustainable at this budget for a
  first-generation system.
* Rejected despite: would be the most accurate option per species.

### Option 3: Single generic model across all enclosures
One anomaly-detection model applied uniformly regardless of species.

#### Consequences
* Rejected because: the collection's diversity (aquatic to land-based,
  wildly different baselines) makes a single model likely to be either
  too noisy or too insensitive for most species.
* Rejected despite: cheapest and simplest to build and maintain.

### Option 4: Keeper-reported + AI-assisted triage only (no pervasive sensors)
Rely primarily on keeper observation, with AI used only to spot patterns
in logged data.

#### Consequences
* Rejected because: doesn't meet the brief's expectation of active
  monitoring/tracking infrastructure, and misses conditions keepers
  wouldn't notice between visits.
* Rejected despite: lowest hardware cost and fastest to stand up; kept
  as a component of the selected option rather than the whole solution.

## Advice
* Start with the 2-3 highest-value tiers (e.g. the piranha/aquatic tier,
  given its explicit population-tracking requirement — see ADR006) and
  expand tier coverage incrementally rather than deploying to all 55
  enclosures at once. - Animal Welfare Lead, Sep 2026

## Supporting Material
* Spike 005: Animal health & feeding monitoring approach
* ADR002: Edge vs. Cloud Inference Strategy
* ADR006: Jumping Piranha Population Counting
* ADR007: Alert Validation & False-Positive Tolerance
