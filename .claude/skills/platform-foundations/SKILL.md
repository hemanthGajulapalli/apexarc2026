---
name: platform-foundations
description: Reference for Von Digitalis Estates' cross-cutting platform architecture — overall system style, cloud platform, data storage, IoT/gateway security, identity & RBAC, observability, disaster recovery, and CI/CD (ADR012–ADR020). Use whenever working on system-wide architecture, infrastructure, authentication/authorization, storage strategy, security, monitoring, backups, or the deploy pipeline, rather than a single use case, so this context doesn't need to be re-derived from the repo each time.
---

# Platform Foundations

These ADRs underpin every use case rather than belonging to one. Consult the individual ADR files for full trade-off analysis — this is the condensed decision index. Full consolidated summary: [`adviceforum/adr-summary-decisions-and-advice.md`](../../../adviceforum/adr-summary-decisions-and-advice.md).

## Architecture style
- **ADR012** — Event-driven, modular-service architecture over the MQTT bus. **Five** services (Ingestion, Popularity Analytics, Animal Monitoring, Ticketing Integration, AI Inference) — not a monolith, not fine-grained microservices. Advice: keep this count small; only split further on a demonstrated need.
- **ADR013** — Single mainstream public cloud provider, managed/serverless-first. No multi-cloud, no self-hosted datacenter.
- **ADR014** — Purpose-fit storage per data type: time-series DB (telemetry), relational DB (transactional/reference data), object storage (media). Resist adding a fourth without a clearly demonstrated need.

## Security & identity
- **ADR015** — Two-tier security matching the LoRaWAN architecture (ADR001): per-device LoRaWAN session keys for ~95 sensors, per-gateway TLS client certs + topic ACLs for the 3 concentrators. No shared/global credentials at either tier.
- **ADR016** — OAuth 2.0/OIDC for **both** visitors and staff, on the cloud platform's managed identity service — **not** delegated to the ticketing SaaS (a revised decision; the original design tied visitor identity to a payments vendor, which was reversed once the vendor-lock-in risk was made explicit). Staff RBAC: Keeper / Operations / Admin, kept deliberately minimal.

## Operations
- **ADR017** — Single shared managed observability stack (logs/metrics/traces) across all services, AI-specific monitoring layered on top. Advice: instrument correlation IDs from day one — retrofitting into an event-driven system later is materially harder. **This has not been implemented in `implementation/`** — see the production readiness report.
- **ADR019** — Tiered backup/DR strategy by data criticality: vendor DR for payments, daily point-in-time recovery for reference data, rolling-window backup for telemetry. Advice: actually test the PITR restore before go-live.
- **ADR020** — Single shared CI/CD pipeline, with an **independent deploy path for AI models gated by golden-set regression** (ADR011). A failing golden-set result is a hard blocker requiring an explicit, logged override — never a silent bypass. See the **ai-governance-verification** skill for how this is actually enforced in code.

## Cross-cutting themes worth internalizing before making a change here
From the ADR summary's own synthesis:
- **Pilot before scaling** — ADR001, ADR005, ADR006, ADR007 all call for validating on a small subset first.
- **Defer speculative investment until data exists** — ADR004, ADR008.
- **Keep operational surface area small** — ADR012, ADR013, ADR014, ADR016 all caution against over-provisioning services/roles/storage tech beyond current need.
- **Architecture can lag the wireframes, but not silently** — ADR021 and ADR022 exist specifically because two AI capabilities were found running in the product wireframes with no ADR behind them. Treat "compare the architecture against what's actually built" as a recurring check, not a one-off.

## Real implementation surface
- **DB engine:** PostgreSQL 14+ (`implementation/db/schema.sql`) — the relational leg of ADR014; time-series is modeled as regular tables with time-bucketed indexes (documented as a stand-in for a real TSDB); object storage isn't implemented (a schema seam only).
- **Identity:** `implementation/server/src/middleware/auth.js` is an explicit, documented stand-in for ADR016's real OAuth/OIDC — swapping this one file is the entire production migration path.
- **Architecture style in code:** `implementation/` runs ADR012's five services (plus ADR021/ADR022) as one modular-monolith Express process, not seven microservices — see `implementation/docs/module-service-map.md` for why that's the architecturally consistent reading of ADR012, not a shortcut.
- **Not yet implemented:** real MQTT/LoRaWAN ingestion, observability/correlation IDs, DR/backup testing, security review, load testing — all named explicitly (not silently) in `implementation/docs/production-readiness-report.md`.

## Where to look for the rest
- Diagrams: `assets/app-stack.svg`, `assets/c2-container-diagram.svg`, `assets/ai-ml-app-stack.svg`, `assets/existing-architectural-characteristics.svg`.
- Cost reasoning: `other_design_docs/cost-analysis.md`. Fitness functions: `other_design_docs/fitness-functions.md`. Rollout phasing: `other_design_docs/roll-out-strategy.md`.
