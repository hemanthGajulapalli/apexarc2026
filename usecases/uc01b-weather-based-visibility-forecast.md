# UC01.b - Weather-Based Visibility & "What to See Where" Forecast (Extended Case — Horizon: 12 months)

> Extended case of [UC01](uc01-visitor-popularity-analytics.md).
> Planned now; implementation in the 12-month horizon. Future (beyond
> this horizon): dedicated on-estate micro-climate stations feeding
> direct meteorological data.

## Overview
Visitor experience and animal activity both vary with weather: outdoor
rides and grounds appeal differently in rain versus sun, some animals
are more active in cool hours, shaded enclosures matter on hot days.
Today the estate has no mechanism connecting meteorology to "what to
see where." This extended case ingests **external weather forecast and
observation feeds** (ADR024 — the first external data feed the estate
consumes) and combines them with UC01 popularity history and UC01.a
occupancy to produce **time-of-day, weather-aware recommendations**:
for visitors ("what to see now given the weather"), for operations
("expect outdoor-ride demand to drop after 14:00, indoor enclosures
to surge"), and later, through the LLM concierge (UC04/ADR022) and the
planner endpoint (UC04.c), as grounded conversational guidance.

## Actor(s)
- **Primary:** Visitors (via apps/concierge), operations staff (demand
  shaping and staffing adjustments)
- **Secondary:** UC04 concierge/assistant (consumes the forecast as
  grounding data)

## Goal
Answer "given the weather, the time, and the season — what should I
see, and where will crowds be?" with grounded, cited forecasts rather
than generic advice.

## Trigger
Scheduled weather-feed pull (multiple times daily, ADR024), or the
hourly UC01 aggregation cycle completing with new weather data
available.

## Preconditions
- External weather feed registered as a provenance-tracked pull-job
  (ADR024).
- At least one season of UC01 popularity aggregates exists (same
  data-maturity logic as ADR008 — weather response curves can't be
  learned from data the estate doesn't have).
- Ops Dashboard / concierge surfaces available for output.

## Main Flow
1. The weather pull-job fetches forecast/observation data on schedule;
   each record lands with source + fetched-at provenance (ADR024).
2. Popularity Analytics joins weather data to historical hourly
   aggregates, building per-attraction weather-response profiles
   (how each ride/enclosure's popularity historically shifts with
   temperature, rain, wind).
3. A **visibility forecast** is produced per zone per time bucket:
   expected appeal/crowding given today's weather trajectory.
4. Outputs flow to: the Ops Dashboard (staffing/demand shaping —
   recommend-then-approve per ADR007/ADR021), and as grounding data
   for the concierge (ADR022) and the future planner (UC04.c).
5. Every visitor-facing recommendation states its grounding
   ("based on forecast rain from 14:00 and historical indoor-enclosure
   surges").
6. *Future:* on-estate micro-climate stations join as LoRaWAN sensors
   on the ADR001 path, replacing/augmenting regional feeds with
   estate-specific readings — an ingestion change, not an
   architectural one.

## AI Involvement
Weather-response modeling and the visibility forecast are statistical/
ML models over joined external + estate data — governed by ADR011
golden-set/drift verification. Any LLM-generated phrasing of
recommendations goes through the ADR022 grounding rules (cite source,
confidence label). Forecast errors on severe-weather days are a
distinct high-bar golden-set category — that's exactly when visitors
act on the advice.

## Alternate / Exception Flows
- **Weather feed unavailable/stale:** advisory degrades to
  weather-unaware UC01 forecasts, clearly labeled; never silently
  presents old weather as current.
- **Unprecedented weather (no historical response curve):** low
  confidence → advisory suppressed or explicitly hedged; no confident
  invention from out-of-distribution data.
- **Severe weather warnings:** UC02.d (public-alert scanning) takes
  the safety-relevant path — closure decisions are human, per ADR007.

## Related ADRs
- **ADR024** — External Data Feed Ingestion
- **ADR008** — Returning Visitor Growth Mechanism (data-maturity gate)
- **ADR021** — Popularity Forecasting & Recommendations
- **ADR022** — Visitor Concierge & Personalization Assistant
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR001** — MQTT Ingestion (future micro-climate stations)

## Success Metrics
- Weather-aware forecast accuracy vs. weather-unaware baseline (MAPE
  improvement on weather-sensitive zones).
- Advisory-grounding citation present on 100% of visitor-facing
  recommendations.
- Measurable demand smoothing on forecast-soft days (occupancy
  variance across zones).

## See Also
- [UC01 - Visitor Popularity Analytics](uc01-visitor-popularity-analytics.md)
- [UC01.a - Real-Time Occupancy & Area Advisory](uc01a-realtime-occupancy-advisory.md)
- [Extended Use Cases Index](extended-uc-index.md)
