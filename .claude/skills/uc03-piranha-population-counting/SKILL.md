---
name: uc03-piranha-population-counting
description: Reference for UC03 (Jumping Piranha Population Counting) in the Von Digitalis Estates project — periodic keeper photo/video capture, vision-model population estimation, and decline-review guardrails. Use whenever working on population counting, the piranha tank, capture/vision workflows, or ADR006, so this context doesn't need to be re-derived from the repo each time.
---

# UC03 — Jumping Piranha Population Counting

Full use case: [`usecases/uc03-piranha-population-counting.md`](../../../usecases/uc03-piranha-population-counting.md) · test approach: [`usecases/uc03-test-approach.md`](../../../usecases/uc03-test-approach.md)

## Goal & actors
Track the piranha population (a brief-mandated specific requirement) without the cost/maintenance burden of always-on underwater computer vision — poor visibility, occlusion, and constant movement make that a poor investment for one enclosure. Primary actor: Keeper (aquatic tier). Secondary: the Countess (visitor safety/attraction viability).

## Trigger & main flow
1. Scheduled keeper check (e.g. weekly, alongside feeding) — a photo/video is captured.
2. Media uploads to object storage (ADR014); a vision model estimates the visible count.
3. Estimate is compared against the running history.
4. A meaningful decline (or unexpected change) routes through **the same tiered-alert/confirmation flow as UC02** (ADR007) — this is a decision aid, not an oracle.
5. Keeper reviews, optionally cross-checks manually, decides on follow-up.
6. Feeding-consumption data (UC02) is an available corroborating signal.

## Related ADRs
- **ADR006** — Periodic manual sampling + AI-assisted counting, not continuous monitoring. A missed capture cycle is an accepted trade-off, not a failure — the next scheduled capture just picks up the history.
- **ADR007** — Same human-in-the-loop guardrail as UC02, reused rather than reinvented.
- **ADR011** — Verification: this model's accuracy must be validated against a keeper's manual count over several cycles before being trusted unsupervised. Notably, this is the one model in the whole solution with **no reliable human-feedback ground truth** available by default (see `models.drift_status`/trust-source notes in the AI Governance skill) — drift monitoring is its *primary* trust signal, not a secondary one.
- **ADR014** — Object storage for captured media; `population_counts.capture_object_key` is the schema seam (no real upload endpoint exists yet — documented stand-in).

## Wireframe
`wireframes/vet-console-wireframe.html`'s **`screen-population`** section (added directly to the Vet Console, not a separate app, since it's the same keeper persona and the same confirm/dismiss interaction language): vision count vs. previous count, 12-week trend chart, capture action, manual cross-check field, **Dismiss — within normal variance** / **Confirm — meaningful decline**, both requiring a keeper note.

## Real implementation (`implementation/`)
- **Service:** same file as UC02 — `server/src/services/animal-monitoring/routes.js` (population-specific handlers).
- **DB table:** `population_counts` (`vision_count`, `previous_count`, `confidence`, `capture_object_key`, `review_status`, `manual_cross_check`).
- **Key endpoints:** `GET /animal-health/population/:zoneId`, `POST /animal-health/population/:zoneId/capture` (Keeper only), `POST /animal-health/population/:id/review` (`{decision: confirmed_decline|dismissed, note, manualCrossCheck?}` — **400** without a note, **409** on a second review of the same capture).
- **AI Governance link:** the model behind this (`Piranha-Count`) is tracked in the AI Governance Console — see the **ai-governance-verification** skill for its golden-set/deploy-gate story, including a real blocked-candidate scenario (`v3.2`, failed on turbid-water/occlusion categories) with a working override flow.
- **Tests:** covered within `implementation/server/test/animalMonitoring.test.js` ("population review requires a note and rejects a second review").

## Success metrics
- Vision-model accuracy validated against manual counts within an agreed tolerance before unsupervised trust.
- A meaningful decline detected within one sampling cycle.
- Keepers retain final judgment — no automated welfare action fires directly from a count.
