# UC04.b - Auto-Generated Guided Tour Itineraries via LLM (1/2/3-Day, Personalized) (Extended Case — Horizon: 12 months)

> Extended case of
> [UC04](uc04-returning-visitor-personalization.md).
> Planned now; implementation in the 12-month horizon. Gated on the
> same Phase Two data maturity as UC04 Phase Two (ADR008) —
> personalization needs visit history that only exists after the
> estate has been running UC01/ticketing for real seasons.

## Overview
A first-time family with one day and an enthusiast couple with three
need different estate plans, and nobody at the gate has time to write
either. This extended case **auto-generates guided tour itineraries**
— 1-day, 2-day, and 3-day plans covering the estate's areas
systematically — using LLM generation **grounded in the estate's own
operational data** (UC01 popularity, UC01.a occupancy, UC02.a
availability, UC01.b weather-aware visibility, ride/enclosure
metadata) and **personalized to the visitor** where Phase Two data and
consent permit (UC04 profile: party composition, past visits, declared
interests, hunt progress from UC04.a). Itineraries are plans, not
chat: structured, checkable, and refreshed when reality diverges (a
ride goes down, weather turns, an area fills).

## Actor(s)
- **Primary:** Visitors (consumers), the ADR022 concierge surface
  (delivery)
- **Secondary:** Estate content team (curates the "must-cover"
  narrative skeleton per tour length), UC01/UC01.a/UC02.a services (data
  grounding)

## Goal
Every visitor has a credible, current, personal plan for their visit —
covering the estate's breadth within their time — without requiring
staff time to produce.

## Trigger
A visitor requests a plan (web, concierge, or the ADR025-planned
app/planner endpoint), or an itinerary-in-progress is invalidated by a
reality change (UC02.a availability, UC01.a full status, UC01.b
weather shift).

## Preconditions
- UC04 Phase Two gate (ADR008): a real season of UC01/ticketing data
  exists — un-personalized generic itineraries can launch earlier;
  personalized ones cannot precede the data.
- Grounding data services live: UC01 aggregates/forecasts, UC01.a
  occupancy, UC02.a availability feed, UC01.b weather visibility.
- ADR022 grounding/verification machinery (the concierge's RAG layer,
  confidence labeling, golden-set) — itineraries reuse it wholesale.

## Main Flow
1. Visitor states constraints: days available, party composition,
   interests, mobility needs (declared, minimal, per ADR018).
2. The generator plans against a structured estate "coverage
   skeleton" per tour length (curated narrative arcs — heritage day,
   animal-collection day, grounds/hunts day — not free-form LLM
   invention), then grounds every stop in live data: open? reachable?
   credible crowd level at that hour (UC01 forecast + UC01.a)?
   weather-appropriate (UC01.b)?
3. The itinerary renders as a structured plan — stops, times, routes,
   what-to-see notes, each grounded and labeled — delivered via the
   ADR022 concierge surface and, later, the ADR025 client API.
4. **In-visit refresh:** while the plan is active, reality changes
   (availability, occupancy, weather) trigger grounded re-planning of
   the affected remainder — never silent staleness; the visitor sees
   what changed and why ("ride X closed; swapped for Y").
5. Post-visit feedback (explicit ratings + telemetry-derived
   completion, consented) labels itinerary quality — the golden-set
   and tuning data for the generator (ADR011).

## AI Involvement
LLM itinerary generation under **strict structural grounding**: the
model chooses and sequences among real, verified-open estate entities
from a retrieval layer — it cannot invent an attraction, promise an
unavailable one, or state a crowd level no data supports (ADR022
discipline, ADR011 verification). Generic (non-personalized)
itineraries have a smaller verification surface and can precede the
Phase Two gate; personalization joins only with the gate.

## Alternate / Exception Flows
- **Pre-Phase-Two launch (no personalization data):** curated
  skeletons + live grounding only — genuinely useful, honestly
  generic.
- **Data-grounding outage:** itineraries degrade to the curated
  skeletons with availability marked "unverified," never fabricated
  freshness.
- **Contradictory constraints (3-day wishes, 1-day window):** the
  plan says what fits and what it dropped — grounded honesty over
  people-pleasing compression.
- **Accessibility/mobility needs:** constraint set the generator must
  satisfy or explicitly flag as unmet; never silently routed through
  an inaccessible route.

## Related ADRs
- **ADR022** — Visitor Concierge & Personalization Assistant
- **ADR008** — Returning Visitor Growth Mechanism (Phase Two gate)
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR018** — Visitor Data Privacy & Governance
- **ADR025** — Estate API Surface (delivery to clients)
- **ADR021** — Popularity Forecasting (crowd-level grounding)

## Success Metrics
- Itinerary completion rate (stops visited vs. planned, consented
  telemetry).
- Grounded-refresh correctness: % of reality changes reflected in the
  active plan within one refresh cycle.
- Visitor ratings and repeat-visit correlation for itinerary users
  vs. non-users (the UC04 growth linkage).

## See Also
- [UC04 - Returning Visitor Personalization](uc04-returning-visitor-personalization.md)
- [UC04.c - MCP Planner Endpoint](uc04c-mcp-planner-endpoint.md)
- [UC04.a - AR Wayfinding App](uc04a-ar-wayfinding-app.md)
- [Extended Use Cases Index](extended-uc-index.md)
