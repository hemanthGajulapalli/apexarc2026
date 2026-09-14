# ADR025 - Estate API Surface for Mobile/AR Clients & MCP Endpoint
* Date: Sep 14, 2026
* Status: ACCEPTED

## Decision
Expose a **versioned, read-oriented estate API surface** (`/api/v1/…`)
as the single backend contract for two future client classes:

1. **Mobile/AR clients** — specifically the planned AR wayfinding app
   (forked from open-source software, per UC04.a): offline
   **season/hunt map packs** (downloadable, versioned content bundles),
   points-of-interest, live full/free area status (from ADR023
   occupancy), and an opt-in **telemetry upload** endpoint feeding
   UC01 popularity analytics.
2. **MCP endpoint** — a Model Context Protocol endpoint exposing estate
   data tools (zones, occupancy, rides, events, weather) so LLM-based
   planners/agents (UC04.b guided tours, UC04.c interest planner)
   consume estate data through a standard, governed tool interface
   instead of ad-hoc API scraping.

Both are **read-dominant, OAuth-authenticated (ADR016), and bound by
ADR018's data-minimization/aggregation-by-default posture**; visitor
telemetry upload is the sole write path and is opt-in per ADR018. The
surface is defined as a contract now (planned today) so the future
clients implement against a stable interface (implemented later) — no
client development is committed by this ADR.

## Context
UC04.a (AR wayfinding) and UC04.c (MCP planner) introduce the estate's
first non-HTML clients and the first agent-consumed interface. The
existing webapp is plain HTML talking to `/api/*` routes directly;
nothing versioned exists, and nothing exists that a forked open-source
mobile app or an MCP client could bind to. Defining the contract before
either client exists is the entire point: a forked OSS app is cheapest
to adopt when the backend surface it needs is small, stable, and
versioned; an MCP endpoint is safest when it exposes the *same*
grounded data tools the human surfaces use, under the same identity and
privacy rules — not a parallel uncontrolled path.

## Options Considered

### Option 1 (SELECTED): One versioned read-oriented API surface serving both AR clients and MCP tools
`/api/v1/` with versioned content-bundle and status endpoints; MCP
tools are thin wrappers over the same service-layer functions those
endpoints call.

#### Consequences
* Adopted because: one surface = one versioning, auth, rate-limiting,
  and privacy policy — critical when one consumer is public-installed
  (AR app) and the other is agent-driven (MCP), the two hardest client
  classes to retrofit controls onto.
* Adopted because: versioning lets season map packs and the OSS fork
  evolve on their own cadence from the estate backend — the fork stays
  adoptable without pinning the estate to the fork's release cycle.
* Adopted because: MCP tools wrapping the same service layer inherit
  the same grounding/verification discipline (ADR011) as human-facing
  surfaces — an LLM planner sees exactly what a visitor's app sees.
* Adopted despite: slightly more up-front contract discipline
  (versioning, deprecation policy) than ad-hoc endpoints.
* Adopted despite: telemetry upload is the first visitor-device write
  path — must be designed conservatively (opt-in, coarse-grained,
  aggregated per ADR018).

### Option 2: Bespoke endpoints per client; no MCP standard
The AR app gets whatever ad-hoc endpoints it needs; the LLM planner
calls the existing HTML-era API directly.

#### Consequences
* Rejected because: an agent scraping human-era endpoints bypasses
  versioning and rate controls and breaks silently when internal routes
  change — ungoverned AI access to estate data is exactly what the
  ADR011/ADR016 posture exists to prevent.
* Rejected despite: fastest path to a demo.

### Option 3: Decide the client API when each client is built
Record no surface now.

#### Consequences
* Rejected because: the fork-vs-build decision for the AR app (UC04.a)
  cannot even be evaluated without knowing what backend surface the
  fork must fill; a contract now is cheap and reversible.
* Rejected despite: avoids premature specification.

## Advice
* Keep the v1 surface deliberately small: map-pack manifest, map pack
  download, POI list, area status, telemetry upload. Every additional
  endpoint widens the public attack surface permanently. -
  Engineering Lead, Sep 2026
* Rate-limit and attribute MCP tool calls per client identity like any
  other API consumer; agents can loop. - Engineering Lead, Sep 2026
* Map packs must be self-contained (map tiles + POI + hunt content,
  content-hashed) so the offline-first app never depends on patchy
  estate WiFi at runtime. - Operations Lead, Sep 2026

## Supporting Material
* UC04.a: AR Wayfinding App (Extended Case)
* UC04.b: Guided Tour Itineraries (Extended Case)
* UC04.c: MCP Planner Endpoint (Extended Case)
* ADR016: Visitor & Staff Authentication / Access Control
* ADR018: Visitor Data Privacy & Governance
* ADR023: LoRaWAN Occupancy Counters (live area-status source)
* ADR011: Verification of Non-Deterministic AI Outputs
