---
name: uc04-returning-visitor-personalization
description: Reference for UC04 (Returning Visitor Personalization) in the Von Digitalis Estates project — Phase One loyalty mechanism, Phase Two grounded concierge/personalization ("Customer GenAI"), and the Customer App. Use whenever working on visitor loyalty, ticket purchase, the Tour Assistant concierge, personalized offers, opt-out/consent, or ADR008/ADR009/ADR016/ADR018/ADR022, so this context doesn't need to be re-derived from the repo each time.
---

# UC04 — Returning Visitor Personalization

Full use case: [`usecases/uc04-returning-visitor-personalization.md`](../../../usecases/uc04-returning-visitor-personalization.md) · test approach: [`usecases/uc04-test-approach.md`](../../../usecases/uc04-test-approach.md)

## Goal & actors
Grow the returning-visitor rate. Deliberately staged: a simple non-AI mechanism ships at launch; AI personalization is held back until real ticketing/popularity data exists to personalize *against* — building it day one would mean personalizing against nothing. Primary actor: repeat/prospective visitors. Secondary: the Countess and marketing/operations.

## Two phases — don't conflate them
- **Phase One (live at launch, no AI, ADR008):** ticket/family-pass purchase enrolls a visitor in a simple loyalty mechanism (digital card, auto-applied discount on return). No personalization logic.
- **Phase Two (future, gated, ADR008's trigger + ADR022):** grounded recommendation model + in-park concierge assistant ("Customer GenAI"), using UC01's popularity data and the visitor's own history. Explicitly not live until a full operating season of real data exists.

## Related ADRs
- **ADR008** — Non-AI Phase One at launch; Phase Two explicitly deferred until data justifies it (the trigger, not a permanent shelving).
- **ADR009** — Ticketing is off-the-shelf SaaS, payment/issuance only — minimal build effort here on purpose (not this solution's differentiator).
- **ADR016** — Visitor identity via OAuth/OIDC on the estate's own platform, **decoupled from the ticketing SaaS** — a visitor's identity survives a future ticketing-vendor change.
- **ADR018** — Personalization is **opt-out** (default on), not opt-in; individual location data never persists beyond aggregation.
- **ADR022** — *(Added after a gap found comparing the architecture to the wireframes — see [`ADR-Spikes/013-spike-visitor-concierge-assistant.md`](../../../ADR-Spikes/013-spike-visitor-concierge-assistant.md).)* Customer GenAI is **grounded/retrieval-based, never open-ended generation** — the concierge cannot invent facts about a ride that doesn't exist in the underlying data. This matters more here than for internal tools: there is no keeper or ops staff member positioned to catch a bad answer before a visitor sees it.

## Wireframe
`wireframes/visitor-hub-wireframe.html` — `screen-signin` (OAuth), `screen-hub`/`screen-options`/`screen-checkout` (ticket purchase, Phase One), `screen-confirm` (personalized offers, explicitly tagged "Phase Two — pilot" + Tour Assistant concierge chat), `screen-account` (digital loyalty card + the personalization opt-out toggle).

## Real implementation (`implementation/`)
- **Service:** `server/src/services/ticketing-integration/routes.js` (ticketing, loyalty, *and* personalization/concierge all live here — visitor-facing domain).
- **DB tables:** `tickets`, `ticket_entries`, `loyalty_accounts` (`personalization_opt_in`), `personalized_offers`, `concierge_queries`.
- **Key endpoints:** `POST /ticketing/purchase`, `GET /ticketing/loyalty`, `PATCH /ticketing/loyalty/consent`, `GET /personalization/offers` (**403** `personalization_opted_out` if consent is off — a real gate, not just an empty list), `POST /personalization/offers/:id/engage` (feedback loop), `POST /concierge/ask` (grounds its answer in real `zones`/`popularity_aggregates_hourly` rows; a question it can't ground gets a low-confidence deflection, never a guess).
- **Real webapp page:** `implementation/webapp/customer-app.html`.
- **Tests:** `implementation/server/test/identityAndTicketing.test.js` — includes a real pricing-calculation test (family pass + add-ons + promo code) and an assertion that the concierge only answers what it can ground.

## Success metrics
- Phase One: measurable loyalty-mechanism uptake within the first season.
- Phase Two trigger: an agreed data-volume threshold reached before development begins (don't build early).
- Phase Two, once live: returning-visitor-rate lift attributable to personalization, measured against the Phase One baseline.

## A note if you're asked to "make personalization live now"
Check `ADR008` and `ADR022` first — Phase Two being gated is a deliberate decision, not a missing feature. If real data now exists, that's a decision to record as an ADR update, not a silent code change.
