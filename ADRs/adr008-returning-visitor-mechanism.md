# ADR008 - Returning Visitor Growth Mechanism
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Launch with a **simple loyalty/rewards mechanism** (non-AI) as the
initial retention lever, and **defer AI-driven personalization**
(itinerary recommendations, tailored offers) until at least one season
of ticketing and popularity data (ADR003, ADR009) exists to
personalize against. Revisit personalization as a phase-two investment
once that data is available.

## Context
The Countess wants more returning visitors but there is currently no
visitor history to personalize against — the ticketing system (ADR009)
that would generate that data doesn't exist yet either. Building an AI
personalization feature before there's data to drive it risks wasted
engineering effort and an undifferentiated/generic experience that
doesn't actually move retention.

## Options Considered

### Option 1 (SELECTED): Simple loyalty program now, AI personalization deferred
Introduce a straightforward mechanism (e.g. discounted family-pass
renewal, a stamped/digital loyalty card) at launch. Once a season of
ticketing and popularity data exists, evaluate an AI-driven
recommendation/concierge feature as a follow-on investment, informed by
real visitor behavior data rather than assumptions.

#### Consequences
* Adopted because: gets a retention mechanism live immediately without
  waiting on data infrastructure that doesn't exist yet, at low
  engineering cost.
* Adopted because: defers the higher-cost AI investment until it can be
  justified and informed by actual visitor data, reducing the risk of
  building a personalization feature nobody's history supports yet.
* Adopted despite: the initial loyalty mechanism is less
  differentiated/engaging than a personalized AI experience would be.
* Adopted despite: requires a deliberate phase-two decision point rather
  than delivering the "full" AI vision in one pass — needs sponsor
  buy-in that this is a staged plan, not a scope cut.

### Option 2: Build AI-driven personalization/concierge at launch
Build itinerary recommendations or a conversational concierge from day
one.

#### Consequences
* Rejected because: with no existing visitor history, there's nothing
  meaningful to personalize against at launch — the feature would
  effectively be generic, undermining the case for building it now.
* Rejected despite: would be the most innovative, judge-visible AI use
  case if it worked well from day one.

### Option 3: Do nothing on retention for now
Focus entirely on ticketing/analytics/animal monitoring, revisit
retention only after those are stable.

#### Consequences
* Rejected because: retention is one of the two named growth levers in
  the brief; leaving it entirely unaddressed misses a stated requirement.
* Rejected despite: would maximize focus on the foundational systems
  first.

## Advice
* Set an explicit trigger for revisiting personalization (e.g. "after
  one full operating season of ticketing data") so this doesn't become
  a permanently deferred item. - Marketing/Operations Lead, Sep 2026

## Supporting Material
* Spike 008: Returning visitor mechanism
* ADR003: Visitor Popularity Tracking Method
* ADR009: Ticketing & Family Pass Architecture
