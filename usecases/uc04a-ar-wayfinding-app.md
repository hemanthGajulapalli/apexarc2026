# UC04.a - AR Wayfinding App (Forked Open Source, Offline Maps & Hunts, Telemetry) (Extended Case — Horizon: 24 months)

> Extended case of
> [UC04](uc04-returning-visitor-personalization.md).
> Planned now (this document + the ADR025 API contract); client
> implementation in the 24-month horizon. **The fork target is
> deliberately not chosen yet** — selecting and evaluating a specific
> open-source base is its own future spike/ADR.

## Overview
Visitors — especially families — navigate the estate with phones, and
estate WiFi is patchy by constraint (ADR001), so any visitor app must
be **offline-first**. This extended case plans a visitor-facing **AR
wayfinding app forked from open-source software** (rapid adoption of a
mature base rather than a bespoke build): position-aware guidance
("where am I, where do I go, what should I see there"), **seasonal
content packs** — downloadable map + points-of-interest + "hunt"
(trail/game) bundles refreshed per season or as new content is
published, so content ships without app releases — and **opt-in
telemetry** that feeds UC01's popularity analytics from the visitor's
own path. The estate backend's entire commitment at this stage is the
**versioned API surface** (ADR025): map-pack manifests and downloads,
POIs, live area status (from UC01.a/ADR023 occupancy), availability
(from UC02.a), and telemetry upload.

## Actor(s)
- **Primary:** Visitors (navigation, hunts, discovery), especially
  returning visitors via UC04 identity
- **Secondary:** Estate content team (season pack authoring), UC01
  analytics (telemetry consumer)

## Goal
A visitor's phone guides them around the estate — where to go, what to
see, and what's open — with no dependence on estate connectivity at
runtime, while their opt-in telemetry sharpens the estate's own
popularity picture.

## Trigger
A visitor downloads/updates a season map pack, opens the app on-site,
or an estate content publish (new hunt, new POI, new season pack).

## Preconditions
- ADR025 versioned API surface defined and served (the backend
  contract this UC binds to).
- Content-pack authoring pipeline (map tiles + POI + hunt content,
  content-hashed, versioned).
- ADR016 OAuth for personalized features; ADR018 consent machinery
  for telemetry (opt-in, coarse-grained, aggregation-by-default).
- Fork-target evaluation spike completed and its ADR recorded
  (explicitly future work — not done by this document).

## Main Flow
1. Visitor (pre-visit or on arrival WiFi) downloads the current
   **season pack** — map, POIs, hunts, availability-cached content —
   self-contained and offline-runnable.
2. On-site, the app positions (device sensors; no estate-wide
   positioning hardware required at this phase) and renders AR/wayfind
   guidance: routes to POIs, live full/free area status where
   connectivity permits (ADR023 via ADR025), "what to see here" cards
   grounded in estate data.
3. Seasonal **hunts** gamify exploration ("find the five heritage
   trees in the west grounds") — content-driven, pack-updatable, and
   UC04-linked so returning visitors' hunt progress feeds their
   loyalty/profile (per ADR018 consent).
4. With consent, the app uploads **telemetry** — coarse path/zone
   presence, never continuous tracking — which lands in UC01's
   popularity pipeline as another anonymized presence source
   (ADR003/ADR018 discipline).
5. Content team publishes new packs/hunts seasonally; versioned
   manifests let the forked clients update independently of app-store
   release cycles.

## AI Involvement
Deliberately none required in the client at this phase — the app is
positioning, content, and telemetry. AI enters through what the app
*consumes*: UC01.b weather-aware recommendations, UC04.c planner
routes, and the ADR022 concierge can all be surfaced as pack/card
content via the ADR025 API, inheriting their existing grounding and
verification (ADR011) without new client-side AI to verify.

## Alternate / Exception Flows
- **No connectivity on-site:** everything in the pack works offline;
  live area-status cards show "last updated" or hide rather than lie
  (the UC01.a freshness rule).
- **Stale pack:** app prompts to update; severely stale packs are
  flagged and their live-data surfaces degrade conservatively.
- **Telemetry consent declined:** the full wayfinding/hunt experience
  works identically without telemetry — personalization falls back to
  Phase One non-AI behavior (ADR008/ADR018 pattern).
- **Fork upstream divergence:** the versioned API contract (ADR025)
  is the estate's insulation — the fork tracks upstream on the
  estate's schedule, not the reverse.

## Related ADRs
- **ADR025** — Estate API Surface for Mobile/AR Clients & MCP
- **ADR023** — LoRaWAN Occupancy Counters (live area status source)
- **ADR016** — Visitor & Staff Authentication / Access Control
- **ADR018** — Visitor Data Privacy & Governance
- **ADR003** — Visitor Popularity Tracking Method (telemetry as source)
- **ADR008** — Returning Visitor Growth Mechanism

## Success Metrics
- Pack-driven session usage offline (no connectivity dependency in
  core flows).
- Telemetry consent rate and its measured uplift to UC01 zone-count
  accuracy.
- Hunt participation and repeat-visit correlation (the UC04 growth
  mechanism).
- Time from estate content publish to visitor-visible pack (target:
  days, no app release).

## See Also
- [UC04 - Returning Visitor Personalization](uc04-returning-visitor-personalization.md)
- [UC01.a - Real-Time Occupancy & Area Advisory](uc01a-realtime-occupancy-advisory.md)
- [UC04.c - MCP Planner Endpoint](uc04c-mcp-planner-endpoint.md)
- [Extended Use Cases Index](extended-uc-index.md)
