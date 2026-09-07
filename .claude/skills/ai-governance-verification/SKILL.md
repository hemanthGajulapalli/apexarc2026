---
name: ai-governance-verification
description: Reference for AI verification and governance across the Von Digitalis Estates project — golden-set regression, drift monitoring, the hard CI/CD deploy gate, model provider portability, and the AI Governance Console. Use whenever working on model testing/verification, the deploy gate, overrides, drift, model registry, provider portability, or ADR010/ADR011/ADR020, so this context doesn't need to be re-derived from the repo each time.
---

# AI Governance & Verification

This is the cross-cutting module the judging criteria's "validation and verification approach for AI-produced results" is scored against most directly. Full guardrails diagram: `assets/ai-guardrails-verification.svg`.

## Related ADRs
- **ADR010** — Thin model/provider abstraction layer over a standard API shape; prefer open/self-hostable models for lower-stakes tasks. Advice: validate the abstraction by actually swapping providers for one feature in a lower-stakes environment before relying on it for animal-welfare features.
- **ADR011** — Human feedback loop + statistical drift monitoring in production, plus golden-set regression at deploy time / after provider changes. Advice: define, **per feature**, which signal is the primary trust source — not every feature has reliable human feedback (e.g. UC03's population counting has none, so drift monitoring is primary there).
- **ADR020** — Golden-set regression is a **hard CI/CD gate**, not advisory. A failing result blocks deployment; the only way past it is an explicit, logged override — never a silent bypass. Advice: treat this as a hard blocker requiring an explicit override decision, always.

## The four models actually tracked (see `db/seed.sql` for the real seeded state)
| Model | Governing ADR | Backs |
|---|---|---|
| Health & Feeding AI | ADR005 | UC02 |
| Piranha-Count | ADR006 | UC03 |
| Ops AI | ADR021 | UC01 |
| Customer GenAI | ADR022 | UC04 |

Every row in the `models` table has a `governing_adr` column — **this is a completeness check you can run**: any model with no `governing_adr` (or an ADR that doesn't actually cover it) is exactly the kind of gap that produced ADR021/ADR022 in the first place. Re-check this whenever a new AI-driven capability gets built.

## Wireframe & real webapp
`wireframes/ai-governance-console-wireframe.html` — `screen-registry` (model list with golden-set/drift status), `screen-model` (per-category test-result breakdown *before* any deploy decision — not just a pass/fail badge — plus the override modal), `screen-accounts` (staff RBAC management). Real, API-wired page: `implementation/webapp/ai-governance-console.html`.

## Real implementation — the actual enforced gate
- **Service:** `server/src/services/ai-governance/routes.js`.
- **DB tables:** `models`, `golden_set_runs`, `golden_set_category_results`, `drift_metrics`, `deploy_log`, `deploy_overrides`.
- **The gate itself:** `POST /ai-governance/models/:id/promote` returns **409 `golden_set_failed`** if the latest golden-set run didn't pass, and **409 `no_golden_set_run`** if there's no run on record at all — there is no parameter that bypasses this from this endpoint.
- **The only way past a blocked gate:** `POST /ai-governance/models/:id/override` — **400** without a non-empty `justification`, **409 `not_blocked`** if you try to override a model that's already passing (use `/promote` instead). A successful override still logs a `deploy_log` row with `result: 'fail'` — it is never disguised as a clean pass.
- **Even a passing promotion is human-reviewed**, not silent auto-deploy — every `deploy_log` entry is attributed to `promoted_by`.
- **RBAC:** every endpoint here is Admin-only.

## The concrete blocked scenario already seeded (use this to demo or extend the flow)
`Piranha-Count v3.2` is seeded as `blocked`, golden-set score `0.81` against a `0.85` threshold, with a real per-category breakdown: clear water 39/40, turbid/low-visibility 21/30, occlusion 19/25, low light 22/25. `v3.1` is `production`. This is exercised end-to-end — sign-in → open model → see the category breakdown → attempt override without justification (rejected) → override with one (accepted, persisted, survives a hard page reload) — by `implementation/server/e2e/smoke.mjs` (`npm run e2e`), a real Puppeteer browser test, 9/9 passing.

## Tests
`implementation/server/test/aiGovernance.test.js` (9 cases) — covers every branch above, including "promoting v2 retires the prior production v1 of the same model name" and a data-integrity check against the seeded Piranha-Count breakdown. See `implementation/docs/test-strategy.md` for the full catalog and the real bugs this suite caught (unrelated to this module specifically, but same suite/methodology).

## If asked to add a new AI-driven feature
1. Check it has (or gets) a governing ADR — don't let it run in a wireframe or webapp page without one (that's precisely the mistake ADR021/ADR022 retroactively fixed).
2. Register it in `models` with a real `golden_set_threshold`.
3. Wire its deploy path through `/promote` and `/override` rather than a bespoke status flip — the gate only protects what goes through it.
