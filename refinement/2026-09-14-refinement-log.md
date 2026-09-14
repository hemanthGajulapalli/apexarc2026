# Refinement Log — 2026-09-14

The artifacts from today's sessions exist in the repo; this log captures
the *reasoning trail* behind them — the inputs, corrections, and choices
made along the way — so a reader can see not just what was decided but
why and how it evolved.

---

## Session 1 (morning): Extended use cases program — 14 capabilities + ADR023–027

See commit `acd6eaa`, the [extended use cases index](../usecases/extended-uc-index.md), and ADR023–027.

- **Input:** the business enumerated 14 new/extended capabilities —
  maintenance & repair scheduling, real-time occupancy advisory,
  dynamic pricing / pre-exit refunds, AR wayfinding, LLM guided tours,
  an MCP planner endpoint, flora husbandry standards, weather-based
  visibility forecasts, commercial satellite flora monitoring,
  proactive public-notice alert scanning, business decision support,
  and a regulatory/compliance advisory.
- **Approach:** rather than new top-level use cases, each capability
  became a **sub-numbered extended case** (UCxx.a) under its parent
  (UC01–UC04), each with an implementation horizon (3 / 6 / 12 / 24
  months). Posture: *planned today, implemented on horizon* — the docs
  and ADRs exist, code arrives per horizon.
- **Key design result:** nothing changed the fundamentals. Every new
  inbound data class (occupancy counters, weather, public notices,
  satellite, visitor telemetry) is batch/periodic and lands in the
  existing ingestion service — polling only, no inbound webhooks
  (ADR024). New outbound surfaces (AR app, MCP planners) sit behind one
  versioned read-oriented API (ADR025). Every new AI feature reuses the
  two standing guardrails: human confirmation (ADR007) and golden-set
  verification (ADR011).
- **Genuinely contested points → 5 new ADRs:**
  - **ADR023** — duty-cycled LoRaWAN occupancy counters, including a
    *bounded, named exception* to ADR004's no-streaming default
    (occupancy surface only; ADR004 otherwise unchanged).
  - **ADR024** — external data feed ingestion (weather, public-domain
    notices, satellite) as scheduled batch pulls, provenance-tracked.
  - **ADR025** — one versioned estate API surface serving both the AR
    app and MCP planner tools; MCP wraps the same service layer.
  - **ADR026** — grounded RAG over a versioned SOP/regulation corpus
    with clause citations; corpus versioning named as the real
    deliverable; no fine-tuned weights.
  - **ADR027** — dynamic pricing is recommend-then-approve within
    published bands; refunds stay deterministic policy with no AI in
    the money decision; autonomous pricing explicitly fenced off as
    requiring a future fundamental-change ADR.

---

## Session 2 (midday): Business continuity — ADR028 + BC SOP

See [ADR028](../ADRs/adr028-business-continuity-manual-fallback.md) and the
[BC fallback SOP](../other_design_docs/business-continuity-fallback-sop.md).

- **Starting input:** ADR019's disaster recovery answers "how does IT
  come back," but not "how does the estate keep operating meanwhile."
  Business continuity is a distinct discipline — SOPs, fallback
  communication channels, minimum viable data. The seed idea: periodic
  exports (e.g. nightly reports of who booked what, sent to email/
  Excel) so each process has a manual mode — admit visitors from a
  printed manifest, keepers work from paper checklists — and a
  reconciliation step merges the paper back honestly on recovery.
- **Initial analysis:** every process was mapped to its
  system-of-record tables; the export → manual-fallback → reconciliation
  chain is the bridge between DR (data survives) and BC (business
  operates). Personalization/concierge was marked **accepted loss** —
  it degrades to generic service rather than getting a fake fallback.
- **Key correction (user):** the first draft assumed email would still
  be available. Wrong — the planning assumption must be **total outage,
  including the email provider**; the fallback is a *documented
  secondary email provider using the same estate credentials*, a
  configuration-level switch, not a code change. Also scoped out
  explicitly: connectivity/network resilience — this is IT-systems and
  business-process continuity only, not infrastructure DR.
- **Clarified choices:** deliverables are docs-only (no implementation
  code) — ADR028 plus the SOP doc; email fallback framed as a
  secondary-provider runbook rather than a provider-agnostic
  abstraction.
- **Artifacts:** ADR028 (PROPOSED) following ADR019's structure; the BC
  SOP with the process-by-process mapping table (all table names
  verified against `implementation/db/schema.sql`), comms fallback
  runbook, blind-tolerance tiering, reconciliation SOP, rehearsal
  requirement (tabletop + paper-mode gate drill), and a pre-staged
  materials checklist. The ADR summary index gained a "Business
  Continuity Decisions" section and its stale "all 22 ADRs" count was
  corrected to 28.
