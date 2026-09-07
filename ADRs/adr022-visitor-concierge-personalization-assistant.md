# ADR022 - Visitor Concierge & Personalization Assistant ("Customer GenAI")
* Date: Sep 7, 2026
* Status: ACCEPTED

## Decision
Introduce a customer-facing generative AI layer ("Customer GenAI")
comprising two grounded features: (1) an in-app conversational "Tour
Assistant" answering visitor questions about rides, wait times, and the
animal collection, and (2) a personalized-offers surface shown at
checkout confirmation. Both are grounded in the estate's own ride/
ticketing/popularity data — not open-ended/ungrounded generation — and
both are the Phase Two capability UC04 already gates on real ticketing
+ popularity history existing first (ADR008). Every generated response
must cite its grounding source and a confidence score, and
personalization is opt-out (default on, per ADR018) from the visitor's
account settings.

## Context
UC04 named an "in-park AI concierge experience" as a Phase Two
possibility but scoped no architecture for it. A Customer App wireframe
was subsequently built showing both a live conversational assistant and
personalized checkout offers — running ahead of any ADR, with no
decision recorded on what data grounds its answers, how hallucination
risk is bounded for a visitor-facing (not internal) AI surface, or how
it fits the golden-set/drift verification approach every other AI
feature in this solution goes through (ADR011). This is a higher-stakes
gap than most of the other AI features: a wrong internal alert gets
caught by a keeper or ops staff member before it matters; a wrong
answer to a visitor asking about a ride's status or safety is seen
directly by the public with no human in the loop at the moment of
delivery.

## Options Considered

### Option 1 (SELECTED): Grounded/retrieval-based assistant + offers, confidence-labeled, gated on Phase Two data maturity
The assistant only answers from a retrieval layer over the estate's own
live data (ride/animal status, wait times, ticket policy, popularity
trends) — no open-ended generation about topics outside that grounding
set. Every response carries a visible confidence score and states what
it's grounded in (matches the wireframe's existing "grounded in ride/
animal data + live telemetry" pattern). Personalized offers use the
same grounding discipline, built on the visitor's own ticketing/
popularity history (UC01). Both features stay behind UC04's existing
Phase Two gate (ADR008) — not available at launch, only once real data
exists to ground them meaningfully — and go through the same
golden-set/drift verification as every other AI feature (ADR011), now
tracked as its own entry in the AI Governance Console (ADR020).

#### Consequences
* Adopted because: grounding in the estate's own operational data (not
  open-ended generation) substantially bounds hallucination risk for a
  public-facing feature — the assistant literally cannot invent facts
  about a ride that doesn't exist in the underlying data.
* Adopted because: reuses UC04's already-agreed Phase Two data-maturity
  gate (ADR008) rather than inventing a new launch condition — this
  feature doesn't make sense before that gate anyway, since there's no
  visit history to personalize against or ride-status data pipeline
  mature enough to ground a real-time assistant.
* Adopted because: visible confidence + grounding-source labeling on
  every response gives visitors (and the estate) a way to judge trust
  per-answer, rather than presenting AI output as unqualified fact.
* Adopted despite: retrieval-based grounding is still not a hard
  guarantee against a wrong or stale answer (e.g. if underlying
  wait-time data is delayed) — this residual risk is exactly what
  golden-set testing and drift monitoring (ADR011) must specifically
  cover for this feature, more so than for internal tools, precisely
  because there's no keeper or ops staff member positioned to catch a
  bad answer before a visitor sees it.
* Adopted despite: adds meaningful new engineering scope (a retrieval/
  grounding layer, response-confidence scoring, a golden-set for
  conversational QA specifically) beyond what UC04's original text
  implied.

### Option 2: Open-ended general-purpose assistant (no grounding restriction)
Use a general LLM without restricting it to the estate's own data —
broader conversational ability, can answer anything.

#### Consequences
* Rejected because: unbounded hallucination risk on a visitor-facing,
  unsupervised surface is unacceptable given the judging criteria's
  explicit focus on verification and uncertainty-handling — an
  ungrounded assistant could confidently state wrong information about
  ride safety or animal enclosures with no human in the loop.
* Rejected despite: simpler to build and more broadly useful/
  conversational than a narrowly-grounded assistant.

### Option 3: No conversational assistant — recommendations/offers only, no chat
Drop the "Tour Assistant" chat entirely; keep only the
personalized-offers surface at checkout, which is easier to bound (a
fixed set of offer templates populated from real data) than open
conversation.

#### Consequences
* Rejected because: the concierge chat is one of the more genuinely
  novel, visitor-facing "innovative use of AI" moments in the whole
  submission, and UC04 explicitly named it — dropping it loses a real
  differentiator for a smaller verification-scope win.
* Rejected despite: meaningfully smaller AI-verification surface to
  build and maintain, and offers alone still deliver most of the
  personalization value.

## Advice
* Build the golden-set for the Tour Assistant from real visitor
  questions (support logs, FAQ, staff-fielded questions), not synthetic
  ones — a conversational golden-set only catches what it was built to
  expect. - Engineering Lead, Sep 2026
* Treat any assistant response touching ride/animal safety information
  as a distinct, higher-bar category in golden-set + drift monitoring
  than general park-info questions (e.g. hours, ticket prices) — the
  cost of a wrong answer isn't uniform across question types. -
  Engineering Lead, Sep 2026
* Revisit whether a lightweight human-escalation path ("connect me to a
  person") is needed for questions the assistant can't ground
  confidently, rather than forcing a low-confidence guess. - Operations
  Lead, Sep 2026

## Supporting Material
* Spike 013: Visitor concierge & personalization assistant
* UC04: AI-Assisted Returning Visitor Personalization
* ADR008: Returning Visitor Growth Mechanism
* ADR010: Model & Provider Portability Strategy
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR018: Visitor Data Privacy & Governance
* ADR020: CI/CD & Model Deployment Pipeline
