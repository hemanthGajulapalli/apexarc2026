# ADR027 - Dynamic Pricing, Discounts & Pre-Exit Refunds
* Date: Sep 14, 2026
* Status: ACCEPTED

## Decision
Introduce **AI-recommended, human-approved dynamic pricing and
discounts**, plus a **rules-based refund flow for unused tickets**:

* **Pricing/discounts:** an AI model recommends price adjustments or
  discounts (demand-based, using UC01 forecasts and ADR023 occupancy;
  seasonality; personalization offers from UC04's Phase Two data) via
  the existing `recommendations` → approve pattern. **Every price
  change requires explicit human approval before it reaches the
  ticketing SaaS** (ADR009) — the estate does not run autonomous
  pricing. Approved changes sync to the ticketing SaaS through its
  existing integration; the estate's thin layer (ADR009) remains the
  single place prices are staged.
* **Refunds:** deterministic, non-AI rules only — a ticket that was
  purchased but **unused before exit** (never scanned at the gate, or
  partially used within a published policy window) is refundable
  automatically within policy; anything ambiguous routes to human
  review. No AI decides refunds.

If the business ever wants **autonomous** (no-human-in-loop) pricing,
that is a *fundamental policy change* requiring a new ADR — it is
deliberately out of scope here and flagged for discussion.

## Context
The business roadmap (extended case UC04.d, 6–12-month horizon) asks
for dynamic pricing/discounts to smooth demand toward the 15,000
visitors/day target, and a refund flow for tickets bought but unused
pre-exit. Pricing directly touches revenue, fairness, and the public —
the highest-stakes category of AI decision the estate has contemplated,
and the first where the ADR007 "human confirms" guardrail meets money
movement at scale. Refunds, by contrast, are a policy/audit problem,
not a prediction problem — applying AI there would add unverifiable
nondeterminism to a money path for no benefit.

## Options Considered

### Option 1 (SELECTED): Recommend-then-approve pricing (ADR007 pattern) + deterministic rules-based refunds
Pricing/discount model produces recommendations into the existing
recommendations/approval flow; refunds execute as plain policy rules.

#### Consequences
* Adopted because: recommend-then-approve reuses the ADR007/ADR021
  approval machinery exactly — a price recommendation is governed like
  a staffing recommendation, including audit attribution.
* Adopted because: deterministic refunds keep AI out of a money path
  where it adds risk, not value; policy rules are auditable and
  defensible to customers and regulators.
* Adopted because: autonomous pricing is explicitly fenced off and
  flagged, so the "AI decides discounts" ambition the business raised
  has a recorded, reasoned boundary rather than a silent default.
* Adopted despite: human approval is a throughput limit during demand
  spikes — mitigated by pre-approved *policy bands* (e.g. "discounts
  up to 15% on forecast-soft weekdays") that the model operates within
  without per-change approval.
* Adopted despite: staged prices in the thin layer must be kept in
  sync with the ticketing SaaS (ADR009), which already owns checkout —
  the sync contract is new integration surface.

### Option 2: Fully autonomous AI pricing (no human in loop)
Model sets prices directly against the ticketing SaaS.

#### Consequences
* Rejected because: it breaks the estate's core ADR007 principle for
  the highest-stakes decision class yet (public-facing revenue), and a
  misbehaving model can move prices for 15,000 visitors/day before any
  human notices. Flagged as requiring a future fundamental-change ADR
  if the business genuinely wants it.
* Rejected despite: maximum responsiveness and zero approval overhead.

### Option 3: Fixed seasonal pricing only; no dynamic component
Published seasonal price calendar, no AI involvement at all.

#### Consequences
* Rejected because: it forgoes the demand-smoothing value that UC01's
  forecasting data (already built) makes cheap to exploit, and the
  growth target makes demand shaping genuinely valuable.
* Rejected despite: simplest possible governance story.

## Advice
* Start with pre-approved discount bands and zero per-change approvals
  in the pilot — measure how often the model wants to exceed the bands
  before deciding how much approval friction is real. - Operations
  Lead, Sep 2026
* Publish the refund policy on the ticket at purchase; a refund engine
  is only defensible if the rules were disclosed up front. -
  Operations Lead, Sep 2026
* Golden-set the pricing model against historical demand vs. actual
  revenue outcomes per ADR011 before any band widening. - Engineering
  Lead, Sep 2026

## Supporting Material
* UC04.d: Dynamic Pricing & Pre-Exit Refunds (Extended Case)
* ADR007: Alert Validation & False-Positive Tolerance (human-in-loop)
* ADR009: Ticketing Family-Pass Architecture (SaaS integration)
* ADR021: Popularity Forecasting & Recommendations (approval pattern)
* ADR023: LoRaWAN Occupancy Counters (live demand signal)
* ADR011: Verification of Non-Deterministic AI Outputs
