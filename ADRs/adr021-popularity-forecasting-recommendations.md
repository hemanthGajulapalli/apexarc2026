# ADR021 - Popularity Forecasting & Staff/Investment Recommendation Engine
* Date: Sep 7, 2026
* Status: ACCEPTED

## Decision
Add a predictive layer ("Ops AI") on top of the popularity-analytics
pipeline (UC01/ADR004): a short-horizon (same-day) demand forecasting
model, plus a recommendation model that turns forecasts and current
state into specific staff-deployment and investment suggestions,
surfaced in the Ops Dashboard's Decision Panel. This extends, rather
than replaces, ADR004's hourly/daily aggregation — the forecast model
consumes the same hourly aggregates as its primary input, not raw event
streams, so it does **not** require the streaming infrastructure ADR004
explicitly rejected. Every recommendation requires explicit staff
approval (identity + comment) before being considered "committed,"
extending ADR007's human-in-the-loop pattern from animal-welfare alerts
to operational/investment decisions.

## Context
UC01's popularity analytics (ADR003/ADR004) was scoped as descriptive:
"aggregation and trend surfacing, not prediction." Since then, an Ops
Dashboard wireframe was built — ahead of this decision — showing
same-day demand forecasting (MAPE-tracked), peak-hour prediction, and
specific staff/investment recommendations with confidence scores, none
of which had architectural backing. This ADR retroactively formalizes
that capability: operations staff clearly find "will this zone get
busier in the next 2 hours" more actionable than "was this zone busy in
the last hour," and forecasting-plus-recommendation is a materially
higher-stakes AI feature than simple aggregation — it can misallocate
staff or misdirect capital if wrong, and it was previously running
without golden-set/drift coverage in the AI Governance Console (a gap
closed alongside this ADR).

## Options Considered

### Option 1 (SELECTED): Batch-derived short-horizon forecast + recommendation model, human-approved
Train a forecasting model on the same hourly/daily aggregates ADR004
already produces (no new streaming infrastructure). Same-day forecast
only (next few hours), refreshed each time a new hourly aggregate
lands — not continuous/real-time. A second, simpler recommendation
model turns forecast + current occupancy into specific staff-deploy /
investment suggestions with a confidence score and a "Why?"
attribution, but nothing executes automatically — every recommendation
sits as "Pending approval" until an operations staff member approves it
with identity + comment, logged to an audit trail (mirrors ADR007).

#### Consequences
* Adopted because: reuses ADR004's existing batch pipeline as the only
  input — no streaming infrastructure needed, staying consistent with
  ADR004's cost/complexity reasoning.
* Adopted because: turns "the estate was busy" into "the estate will
  likely be busy, and here's what to do about it," which is what
  operations staff actually need to act same-day.
* Adopted because: routing every recommendation through mandatory human
  approval (identity + comment + audit trail) keeps this consistent
  with ADR007's human-in-the-loop principle, extended from animal
  welfare to operational/financial decisions — appropriate given a
  wrong investment recommendation has real cost.
* Adopted despite: forecast accuracy (tracked via MAPE) will be
  materially worse on batch-derived hourly data than a model fed
  continuous signals — accepted because ADR004 already ruled out
  streaming on cost/reliability grounds, and a same-day forecast
  doesn't need minute-level freshness.
* Adopted despite: adds a new AI Inference workload (forecasting +
  recommendation) that must go through golden-set regression and drift
  monitoring (ADR011/ADR020) like every other AI feature — not "free"
  just because it builds on existing analytics (echoes UC01's own
  caution about this exact risk).
* Adopted despite: a wrong staffing recommendation has a smaller blast
  radius than a wrong investment recommendation (reversible same-day
  vs. sunk capital) — the approval flow should weight these differently
  in practice (see Advice).

### Option 2: Descriptive analytics only — no forecasting or recommendations (revert to original UC01 scope)
Keep popularity analytics exactly as ADR004 scoped it: hourly/daily
aggregates only, no prediction, no recommendation engine. Remove the
forecast chart, MAPE KPI, and Decision Panel from the Ops Dashboard
wireframe.

#### Consequences
* Rejected because: the wireframe already demonstrated real operational
  value (same-day reactive staffing, investment prioritization) that
  pure historical aggregation can't provide, and rebuilding that case
  for a future phase would just re-invent this decision later under
  time pressure.
* Rejected despite: simplest possible scope, exactly matching the
  original brief's minimum-viable analytics ask, with zero additional
  AI-verification surface area to build and maintain.

### Option 3: Full real-time streaming forecast pipeline
Build dedicated streaming infrastructure (as ADR004 originally
rejected) to feed a continuously-updating forecast model.

#### Consequences
* Rejected because: ADR004's cost/complexity/patchy-WiFi reasoning
  still applies in full — nothing about adding forecasting changes that
  trade-off, and same-day (not minute-level) forecasting doesn't need
  it.
* Rejected despite: would produce materially better forecast accuracy
  than the batch-derived approach.

## Advice
* Track forecast accuracy (MAPE) and recommendation approval/override
  rates from day one in the AI Governance Console (ADR011/ADR020) —
  this model was live in the product wireframes before it had
  golden-set or drift coverage; don't repeat that gap for the next AI
  feature. - Engineering Lead, Sep 2026
* Differentiate the approval flow by reversibility: staffing
  recommendations (reversible same-day) can reasonably use a
  lighter-weight approval than investment recommendations (sunk
  capital) — revisit whether a single "Pending approval" pattern is
  granular enough once real usage data exists. - Operations Lead, Sep
  2026
* Validate MAPE against a naive baseline (e.g. "same hour last week")
  before trusting the model's added value — a forecast model that
  doesn't beat a naive baseline isn't worth the added verification
  burden. - Engineering Lead, Sep 2026

## Supporting Material
* Spike 012: Popularity forecasting & recommendation engine
* ADR003: Visitor Popularity Tracking Method
* ADR004: Real-Time vs. Batch Analytics Pipeline
* ADR007: Alert Validation & False-Positive Tolerance
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR020: CI/CD & Model Deployment Pipeline
