# ADR024 - External Data Feed Ingestion (Weather, Public Notices, Satellite)
* Date: Sep 14, 2026
* Status: ACCEPTED

## Decision
Ingest all **third-party external data feeds** — meteorological
weather forecasts/observations now; continuous scanning of public-domain
notices/alerts; commercial satellite imagery subscriptions later — via
**scheduled batch pull-jobs into the existing ingestion service**. No
new transport infrastructure, no always-on connections, no new service.
Every external feed record is stored with **provenance metadata**
(source, fetched-at timestamp, source document/reference) so downstream
AI features can cite their grounding and the audit trail (ADR014/
ADR018 discipline) remains intact. Feeds run on schedules matched to
their decision cadence (weather: multiple times daily; public-notice
scans: continuous-simulating poll every N minutes; satellite: nightly
or spread across the day per the subscription's delivery windows).

## Context
Three extended use cases (UC01.b weather-based visibility forecasting,
UC02.d proactive public-alert scanning, UC02.c satellite flora
monitoring) all need *external* data — a class of inbound data the
estate has never handled before (everything to date has originated from
estate-owned sensors via ADR001). The temptation to treat each as a
bespoke integration is real; the architectural question is whether
external feeds change the ingestion architecture. They do not: they are
batch-arriving, provenance-sensitive, decision-cadence-paced data —
which is exactly the shape the existing ingestion service and ADR004's
batch posture already handle.

## Options Considered

### Option 1 (SELECTED): Scheduled batch pull-jobs inside the ingestion service, provenance-first schema
Each feed is a registered pull-job (source, schedule, parser, target
table) executed on a scheduler within the ingestion service; external
APIs are *polled*, never *listened to*.

#### Consequences
* Adopted because: polling matches each feed's actual decision cadence
  (weather forecasts change a few times a day; satellite delivery is
  nightly) — the same "size to the decision cadence" logic as ADR004.
* Adopted because: pull-based ingestion keeps the estate's attack
  surface closed — no inbound endpoints for third parties to push to;
  failures are retried jobs, not dropped connections (patchy-connectivity
  posture of ADR001 applies unchanged).
* Adopted because: mandatory provenance fields let every downstream AI
  output (forecasts, compliance advisories) cite its external source,
  which the ADR011 grounding discipline requires.
* Adopted despite: polling has latency up to one schedule interval —
  irrelevant at these cadences.
* Adopted despite: three very different feed types share one mechanism,
  so the parser/normalizer per feed is where the real per-feed work
  lives.

### Option 2: Per-feed bespoke integrations (webhook receivers, vendor SDKs, one-off pipelines)
Each feed gets whatever integration its vendor prefers, including
inbound webhooks.

#### Consequences
* Rejected because: three pipelines to operate and secure instead of
  one mechanism, and webhook receivers are new inbound attack surface —
  against the estate's cost-efficiency and security posture.
* Rejected despite: lower per-feed integration effort initially and
  access to vendor push features (e.g. severe-weather push alerts).

### Option 3: Defer all external feeds until each consumer UC is built
No ADR now; each future UC decides ad hoc.

#### Consequences
* Rejected because: three UCs at three different horizons (6–24
  months) all need the same mechanism — deciding the pattern once now
  is the "planned today, implemented later" accommodation the extended
  use cases program asked for.
* Rejected despite: avoids specifying anything ahead of need.

## Advice
* Weather is the first feed to land (UC01.b, 12-month horizon) — use it
  to harden the pull-job/scheduler/provenance pattern before the
  public-notice and satellite feeds reuse it. - Engineering Lead, Sep 2026
* For the satellite subscription (UC02.c), budget in the cost-analysis
  doc *before* contracting — this is the first recurring external data
  purchase in the estate's architecture. - Operations Lead, Sep 2026
* Public-notice scanning (UC02.d) must record *what the source said at
  fetch time* (archived copy or hash), not just a link — public pages
  change, and a compliance-relevant alert must be reproducible. -
  Engineering Lead, Sep 2026

## Supporting Material
* UC01.b: Weather-Based Visibility Forecast (Extended Case)
* UC02.c: Satellite Flora Monitoring (Extended Case)
* UC02.d: Proactive Public-Alert Scanning (Extended Case)
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR004: Real-Time vs. Batch Analytics Pipeline
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR014: Data Storage Strategy
