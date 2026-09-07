# Testing Strategy, Frameworks, Test Cases & Results

This mirrors the two-track testing approach already described at the architecture level in [`usecases/test-approach.md`](../../usecases/test-approach.md) and the top-level README's Testing Strategy section — this document is where that approach is actually **executed** against real, running code, not just described.

## Frameworks

| Layer | Framework | Why |
|---|---|---|
| Unit | Node's built-in `node:test` + `node:assert/strict` | Zero extra dependencies for pure business-logic functions (e.g. `alertTiering.js`). Fast, no config. |
| Integration | `node:test` + the app booted **in-process** on an ephemeral port (`test/testHelpers.js`'s `bootApp()`) | Exercises the real Express routing, real Postgres queries, real middleware chain — no mocking of the database or the HTTP layer. This is the bulk of the suite (43 of 46 tests). |
| End-to-end (browser) | Puppeteer (`puppeteer-core`, pointed at the already-installed Chrome — no bundled browser download) | Drives the actual webapp HTML/JS/CSS through a real browser against the real running server, clicking through the override flow exactly as an admin would. Deliberately kept in `e2e/smoke.mjs`, outside `test/`, so `node --test test/` (and CI) never auto-discovers it as a unit/integration test — it needs a live server + browser already running, invoked explicitly via `npm run e2e`. |

No mocking framework is used anywhere in the integration suite. A request that hits `/api/ai-governance/models/:id/promote` really queries and writes to Postgres. This is deliberate: the entire point of this test suite is proving the **guardrails** (human approval, deploy gate, RBAC) are enforced by the server, not by convention or UI discipline — a mocked database can't prove that.

## Test isolation strategy

Each test creates its **own fixture rows** via `test/testHelpers.js` (`createStaffUser`, `createVisitor`, `createTestZone`, `createTestAlert`, `createTestModel`, `createGoldenSetRun`) rather than depending on or mutating the seeded demo data (`db/seed.sql`). This means:
- Tests never collide with each other regardless of execution order.
- The suite can be run repeatedly against the same database without a reset step (fixture names/emails are timestamp-suffixed where collision was possible — see the `unique()` helper).
- The seeded demo data (Amara Osei, Piranha-Count v3.2, etc.) stays intact for manual/demo exploration after a test run.

## Test case catalog

### Unit — `test/unit.alertTiering.test.js` (5 cases)
| Case | Verifies |
|---|---|
| Confidence ≥ 0.9 → `critical` | ADR007 tiering boundary |
| Confidence 0.7–0.89 → `warn` | ADR007 tiering boundary |
| Confidence < 0.7 → `info` | ADR007 tiering boundary |
| `critical`/`warn` → status `notified` | Staff actually get paged for real risk |
| `info` → status `logged` | Low-confidence doesn't spam staff (alert fatigue) |

### Integration — `test/animalMonitoring.test.js` (12 cases)
| Case | Verifies |
|---|---|
| Edge-threshold alert is always `critical`/`notified` | ADR002 — urgent local rules bypass confidence scoring entirely |
| Low-confidence cloud alert is `info`/`logged` | ADR007 tiering, exercised through the real HTTP+DB path |
| Dismiss without a note → 400 | ADR007 hard requirement |
| Dismiss while unauthenticated → 401 | AuthN enforcement |
| Dismiss as `operations` role → 403 | RBAC (ADR016) — only Keeper resolves animal alerts |
| Dismiss with a note → 200, `resolved_by`/`resolution_note` set | **The fixed UC02 gap** — false-positive labeling now exists and is enforced |
| Confirm with a note → 200 | Symmetric true-positive path |
| Re-labeling an already-resolved alert → 409 | Idempotency — a decision isn't re-litigated |
| Treatment proposed before confirmation → 409 | ADR007 — confirm before any consequential action |
| Treatment proposed after confirmation → 201 | Happy path |
| Feeding log as non-Keeper → 403 | RBAC |
| Population review: no note → 400; double review → 409 | Same ADR007 guardrail applied to UC03 |

### Integration — `test/aiGovernance.test.js` (9 cases)
| Case | Verifies |
|---|---|
| Promote with no golden-set run on record → 409 | Can't deploy what's never been tested |
| Promote a **failing** model → 409 `golden_set_failed` | **The hard gate itself** (ADR020) |
| Promote as `operations` (not Admin) → 403 | RBAC |
| Promote a **passing** model → 200, attributed to approver | Happy path, human-reviewed even on pass |
| Override without justification → 400 | ADR020's "explicit, logged" requirement |
| Override with justification → 201, model reaches `production`, deploy log shows `fail` (not disguised as clean) | The *only* path past a blocked gate, fully attributed |
| Override an already-passing model → 409 `not_blocked` | Can't misuse override to skip review |
| Promoting v2 retires the prior production v1 of the same model name | Registry integrity |
| Seeded Piranha-Count v3.2's category breakdown matches (21/30 turbid-water tests passed) | Data-layer correctness for the wireframe's own numbers |

### Integration — `test/popularityAnalytics.test.js` (8 cases)
| Case | Verifies |
|---|---|
| `rollupHourly` counts only events inside the exact hour window | Aggregation correctness (ADR004) |
| `naiveForecast` finds the same-hour-last-week aggregate | Forecast basis correctness — **this test caught a real UTC/local-timezone bug** (see below) |
| `naiveForecast` falls back to a recent average with no history | Graceful degradation |
| Approve without a note → 400 | ADR007 applied to staffing/investment decisions |
| Approve a `blocked` recommendation → 409, even with a note | Stale-data block can't be talked around |
| Approve as a visitor → 403 | RBAC |
| Approve as Operations, with a note → 200, attributed | Happy path |
| Re-approve → 409 | Idempotency |

### Integration — `test/identityAndTicketing.test.js` (13 cases)
| Case | Verifies |
|---|---|
| Sign in with an unsupported provider → 400 | Input validation |
| Sign in twice with the same email → same user ID | Idempotent identity (ADR016) |
| `/auth/me` without a token → 401 | AuthN |
| `/auth/me` returns `staffRoles` | RBAC data shape |
| Non-Admin listing `/staff` → 403 | RBAC |
| Admin inviting a staff member → 201 | Happy path |
| Inviting with an invalid role → 400 | Input validation (ADR016's minimal role list) |
| Purchase with zero adults/children → 400 | Input validation |
| Family-pass purchase computes correct total incl. add-ons + promo | Real pricing logic, not a stub |
| Personalization off → `/personalization/offers` returns 403, not an empty list | ADR018 opt-out is a real gate, distinguishable from "no offers found" |
| Concierge only answers what it can ground | ADR022 — no open-ended generation, low confidence on ungrounded questions |

## Actual results (last run)

```
node --test test/     (implementation/server/)

# tests 46
# suites 8
# pass 46
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms ≈ 10,250
```

**46/46 passing, 0 failures.** This is a real, reproducible run — not a target. Re-run it yourself: `cd implementation/server && npm test`.

### E2E browser run (`npm run e2e`, real Chrome, real server, real Postgres)

```
PASS — index.html loads
PASS — admin (admin-only role) sees exactly the AI Governance Console
PASS — model registry renders real rows from the API
PASS — clicked into the Piranha-Count model row
PASS — test-result category breakdown renders (Turbid / low visibility)
PASS — override button is visible for a blocked model
PASS — override without justification is rejected in the UI
PASS — after override, the model reflects an updated state in the UI
PASS — override is persisted server-side and visible after reload

9/9 passing, exit code 0
```

This drives the actual `ai-governance-console.html` through a real browser — sign in as the seeded Admin, open the blocked Piranha-Count v3.2 candidate, see its real per-category test breakdown, attempt an override with no justification (UI-level rejection), then with one (real API call, real DB write), and finally **reload the page and re-navigate to the same model** to prove the override is a server-side fact, not a client-side illusion. This is the single strongest piece of evidence in this repository that the guardrail is real end to end — UI, API, and database all agreeing after a hard page reload.

## Bugs this suite actually caught (not hypothetical)

Writing and running this suite surfaced three real defects before they reached the webapp, each fixed and re-verified:

1. **Timezone bug in `naiveForecast`** — `Date.prototype.setMinutes(0,0,0)` operates in the server's *local* timezone, not UTC. Under IST (+5:30), this silently shifted the "same hour last week" lookup by 30 minutes, missing the stored aggregate entirely and falling back to the wrong basis. Fixed by switching to `setUTCMinutes`. A test asserting the exact forecast basis (`same_hour_last_week` vs `recent_average_fallback`) is what caught it — an assertion on the *return value* alone would have missed it, since the fallback also produces a numeric answer.
2. **Wrong argument passed to `initialStatusForSeverity`** — the route handler passed `confidence` (a number) instead of the already-computed `severity` (a string), so the string-equality check inside the function silently always fell through to `'notified'`. Every low-confidence cloud-model alert was incorrectly paging staff. Caught by a single integration test asserting the exact `status` value, not just a 2xx response.
3. **Test-fixture hygiene** — a hardcoded (non-unique) model name in one test caused a `UNIQUE` constraint violation on repeated runs. Not an application bug, but worth recording: it's exactly the kind of thing that makes a test suite flaky/order-dependent if left alone, and the fix (timestamp-suffixed fixture names everywhere) is now the enforced pattern via `test/testHelpers.js`.

## What this suite does **not** cover (explicit, not silent)

- **Load/performance testing** — no test exercises the 15,000-visitors/day growth target's concurrency. `other_design_docs/fitness-functions.md` names this as a fitness function; it isn't implemented here.
- **The ML models themselves** — golden-set scores, vision counts, and confidence values are supplied as test inputs, not produced by a real trained model. This suite verifies the *governance and guardrails around* AI outputs, not the outputs' own accuracy — that's ADR011's golden-set/drift responsibility, applied against real models the estate would train, not something a kata prototype can meaningfully test.
- **Real OAuth/OIDC** — `middleware/auth.js` is explicitly a stand-in; there is no test proving a real identity provider integration works, because there isn't one yet (ADR016 names it as the production target).
- **LoRaWAN/MQTT hardware and gateway failure modes** — `buffered` flags exist in the schema and are accepted by the ingestion endpoints, but no test simulates an actual multi-minute gateway outage and recovery.
- **Security testing** (penetration testing, dependency vulnerability scanning) — out of scope for this pass; `other_design_docs/cost-analysis.md` and the README's Testing Strategy section name this as engineering/security-owned work for a later phase.

These are named gaps, not oversights — see the [production readiness report](production-readiness-report.md) for how they factor into the go/no-go assessment.
