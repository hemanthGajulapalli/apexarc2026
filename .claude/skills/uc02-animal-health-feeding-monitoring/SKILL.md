---
name: uc02-animal-health-feeding-monitoring
description: Reference for UC02 (Animal Health & Feeding Monitoring) in the Von Digitalis Estates project — species-tiered anomaly detection, edge/cloud alert tiering, keeper confirm/dismiss guardrails, and the Vet Console. Use whenever working on animal health alerts, feeding logs, keeper workflows, alert tiering/false-positive handling, or ADR002/ADR005/ADR007, so this context doesn't need to be re-derived from the repo each time.
---

# UC02 — Animal Health & Feeding Monitoring

Full use case: [`usecases/uc02-animal-health-feeding-monitoring.md`](../../../usecases/uc02-animal-health-feeding-monitoring.md) · test approach: [`usecases/uc02-test-approach.md`](../../../usecases/uc02-test-approach.md)

## Goal & actors
Early-warning system across 200+ animals in 55 enclosures that keepers can't watch continuously. Primary actor: Keeper/animal welfare staff. Secondary: the Countess (cost/reputation exposure). The model's job is to *notice*, never to *decide* — a human is in charge of every consequential action.

## Trigger & main flow
1. Sensor reading (weight, activity, feeding-station) or keeper-logged observation falls outside the species-tier baseline.
2. **Edge path (ADR002):** simple local thresholds on the gateway raise an immediate alert even if the zone is offline — no model, always urgent.
3. **Cloud path:** richer anomaly-detection model analyzes trend once connectivity allows; tiered by confidence (ADR007).
4. High-confidence → notify keeper; low-confidence → log only (avoids alert fatigue).
5. Keeper reviews, **confirms or dismisses with a note** — that label feeds the tuning loop.
6. Confirmed alerts can proceed to a treatment recommendation, itself requiring keeper approval.

## Related ADRs
- **ADR002** — Hybrid edge/cloud inference. Edge = cheap rule thresholds, always `critical`/`notified`, no model attached. Cloud = tiered by confidence.
- **ADR005** — Species-tiered monitoring profiles (mammal / reptile-land / aquatic), shared sensor kits/models per tier. Keeper-logged data (feeding amount, behavior notes) is a **first-class model input**, not secondary telemetry.
- **ADR007** — The central guardrail of this whole project: tiered severity + **mandatory human confirmation**, and every notified alert gets a true/false-positive label. No AI output ever triggers an automated welfare action alone.
- **ADR011** — Verification approach (golden-set + drift + human feedback) — this is the most AI-dependent, most-guardrailed use case in the solution.

## Wireframe
`wireframes/vet-console-wireframe.html` — `screen-feed` (tiered alert list), `screen-detail` (animal detail, feeding log form, keeper review with **Confirm** / **Dismiss — false positive** — this dismiss path was a real gap found auditing the wireframes against UC02's own text and fixed directly here), `screen-confirm` (treatment approval). Real screenshot: `assets/vet-console-alert-feed.png`.

## Real implementation (`implementation/`)
- **Service:** `server/src/services/animal-monitoring/{routes.js,alertTiering.js}`.
- **DB tables:** `alerts`, `treatments`, `feeding_logs`, `enclosures` (species tier).
- **Key endpoints:** `POST /animal-health/alerts` (system-originated; edge → always critical, cloud → tiered by `alertTiering.js`'s `tierSeverity`), `GET /animal-health/alerts`, `POST /animal-health/alerts/:id/{confirm,dismiss}` (Keeper only, **400 without a note**, **409** if already labeled — this is the server-enforced version of ADR007's guardrail, not just a UI affordance), `POST /animal-health/alerts/:id/treatment` (**409** unless already `confirmed`), `POST /animal-health/feeding-logs` (Keeper only).
- **Real webapp page:** `implementation/webapp/vet-console.html`.
- **Tests:** `implementation/server/test/animalMonitoring.test.js` (12 cases) + `test/unit.alertTiering.test.js` (pure tiering-logic unit tests). Regression-tests a real bug this project's own suite caught: the route handler originally passed `confidence` (a number) instead of the computed `severity` string into `initialStatusForSeverity`, silently notifying staff on every low-confidence alert regardless of tier. Fixed in `animal-monitoring/routes.js`.

## Success metrics
- Time-to-notify minimized, including during WiFi outages (via edge thresholds).
- False-positive rate stays within a keeper-defined tolerance (ADR007) — the confirm/dismiss labeling loop is what makes this measurable at all; it didn't exist in the UI until fixed.
- No confirmed issue undetected for more than one keeper check-in cycle.

## Alternate flows already handled
- Zone offline → edge thresholds still fire (ADR002); cloud analysis resumes on reconnect.
- New/unusual species not fitting a tier → manual exception via keeper logging.
