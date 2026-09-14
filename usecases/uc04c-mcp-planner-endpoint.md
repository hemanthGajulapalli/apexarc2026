# UC04.c - MCP Interest-Planner Endpoint (Visitor-Facing LLM Planning) (Extended Case — Horizon: 12 months)

> Extended case of
> [UC04](uc04-returning-visitor-personalization.md).
> Planned now; implementation in the 12-month horizon.

## Overview
Visitors increasingly plan trips through AI assistants, and the
estate's own surfaces (webapp, concierge) need the same capability:
given a visitor's **declared interests** ("my kids love reptiles and
we only have a half day"), produce an interest-led visit plan. This
extended case exposes an **MCP (Model Context Protocol) endpoint**
(per ADR025) through which LLM agents — the estate's own webapp
planner, and any visitor-side assistant the estate chooses to support —
consume estate data via **governed tools**: zones/POIs, live occupancy
(UC01.a/ADR023), availability (UC02.a), weather-aware visibility
(UC01.b), itineraries (UC04.b), and ticketing/loyalty context where
consented. The point of MCP is governance: estate data reaches LLM
planners through **one versioned, authenticated, rate-limited,
logging tool surface** rather than ad-hoc scraping of human-era
endpoints — the same grounded data the estate's own surfaces use, under
the same rules (ADR016 identity, ADR018 privacy, ADR011 verification
of what the tools return).

## Actor(s)
- **Primary:** Visitors (via the estate webapp planner UI and
  supported assistants), UC04.b itineraries (a tool consumer)
- **Secondary:** AI governance (tool-call logging, ADR020 pipeline),
  platform/security (rate limits, attribution)

## Goal
Any LLM planner the estate sanctions can answer "what should *this*
visitor, with *these* interests, see?" using live, grounded estate
data — through one controlled, auditable interface.

## Trigger
A planner session: a visitor using the estate webapp's interest
planner, or an authenticated external assistant session requesting
estate planning tools.

## Preconditions
- ADR025 versioned API surface and MCP endpoint defined; tool set
  frozen for v1.
- ADR016 OAuth machinery issuing client identities for planners
  (estate first-party, per-visitor delegated where personalized).
- Grounding services live (UC01.a occupancy, UC02.a availability,
  UC01.b visibility, UC04.b itinerary generation).
- Tool-call logging into the audit trail (ADR014) with per-client
  attribution.

## Main Flow
1. A planner client authenticates (ADR016) and connects to the MCP
   endpoint; it sees the published v1 tool set — no other estate
   routes.
2. The visitor states interests/constraints in the planner UI (or via
   their assistant); the agent calls estate tools to ground its
   planning: POI metadata filtered by interest, live occupancy, open/
   closed status, weather visibility.
3. For consented, authenticated visitors, personalization tools
   expose UC04 Phase Two profile data (past visits, loyalty, hunt
   progress) — per ADR018 consent, aggregated where possible.
4. The agent composes the plan; where it uses UC04.b's itinerary
   tool, the returned plan carries UC04.b's grounding labels
   wholesale — the endpoint does not regenerate or embellish verified
   content.
5. Every tool call is logged (client identity, tools, parameters,
   response class) in the audit trail — agent behavior on estate data
   is reproducible and rate-limited like any API consumer.
6. Estate-side golden-set "agent sessions" (ADR011) exercise the tool
   surface: wrong-tool use, stale-data responses, and injection-style
   prompts are test categories for this surface specifically.

## AI Involvement
The estate's own planner LLM is an ADR022-class grounded assistant —
it answers from tool-returned estate data with citations. The MCP
boundary's AI-verification concern is the **tool surface itself**
(data correctness, freshness labeling, consent enforcement) rather
than generation, and it is covered by ADR011 agent-session golden
sets. Third-party assistants are untrusted consumers by default:
read-scoped tools, no unconsented personal data, full logging.

## Alternate / Exception Flows
- **Unauthenticated/anonymous planner:** generic (non-personalized)
  tools only — interest planning still works, personalization does
  not (ADR008 Phase-One-fallback pattern).
- **Tool failure mid-session:** agents receive explicit tool errors;
  plans composed from partial grounding are labeled as such.
- **Prompt-injection via estate content:** tool responses carry only
  structured estate data with provenance — no free-text injection
  surface into agent context from public content fields.
- **Abusive client:** per-identity rate limits and revocation
  (ADR016) cut off looping agents without affecting others.

## Related ADRs
- **ADR025** — Estate API Surface for Mobile/AR Clients & MCP
- **ADR016** — Visitor & Staff Authentication / Access Control
- **ADR018** — Visitor Data Privacy & Governance
- **ADR011** — Verification of Non-Deterministic AI Outputs
- **ADR022** — Visitor Concierge & Personalization Assistant
- **ADR014** — Data Storage Strategy (audit trail)

## Success Metrics
- Planner session completion and visitor satisfaction with
  interest-led plans.
- 100% of estate-data access by LLM planners flowing through the MCP
  surface (zero scraped side-channels — auditable from route logs).
- Tool-response correctness/freshness in agent-session golden sets.
- Rate-limit/incident attribution completeness per client identity.

## See Also
- [UC04.b - Guided Tour Itineraries](uc04b-guided-tour-itineraries.md)
- [UC04 - Returning Visitor Personalization](uc04-returning-visitor-personalization.md)
- [Extended Use Cases Index](extended-uc-index.md)
