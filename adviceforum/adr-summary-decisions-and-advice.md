# Von Digitalis Estates — ADR Summary: Final Decisions & Advice

A consolidated index of all 20 ADRs: the final decision made in each, and
the advice/guidance recorded for the team carrying it forward. See the
individual ADR files for full context and rejected options.

---

## AI-Specific Decisions

### ADR001 — MQTT Ingestion Architecture for Patchy WiFi
**Decision:** Zone-based MQTT gateway devices with local persistent
queuing (store-and-forward); sensors publish to a local gateway, which
buffers and forwards to the cloud when WiFi is available.
**Advice:**
- Pilot the gateway approach in one ride zone and one enclosure cluster
  before estate-wide rollout — validate real-world dropout behavior, not
  just simulated.
- Keep gateway firmware update mechanism simple; ~40-55 gateways is
  still enough to make manual updates painful.

### ADR002 — Edge vs. Cloud Inference Strategy
**Decision:** Hybrid — simple threshold-based alerting runs locally on
gateways for time-critical conditions; richer ML analysis runs in the
cloud on data delivered via store-and-forward.
**Advice:**
- Start local thresholds conservative (fewer false negatives) and tune
  based on real keeper feedback once live.

### ADR003 — Visitor Popularity Tracking Method
**Decision:** Ticket-gate/checkpoint scans as the primary signal
(reusing ticketing infrastructure), supplemented by BLE presence sensing
only in a small number of high-value zones.
**Advice:**
- Choose initial BLE-equipped zones based on where staffing/investment
  decisions are currently hardest to make with gut feel alone; revisit
  after the first season's ticket-gate data.

### ADR004 — Real-Time vs. Batch Analytics Pipeline
**Decision:** Hourly batch aggregation for staffing decisions, daily
batch for longer-term investment/trend reporting. No dedicated streaming
infrastructure.
**Advice:**
- Revisit if a future feature (e.g. live queue-time displays) requires
  genuinely real-time data — that would justify streaming investment on
  its own merits.

### ADR005 — Animal Health & Feeding Monitoring Approach
**Decision:** Species-tiered monitoring profiles (mammals,
reptiles/land, aquatic) with shared sensor kits and models per tier,
plus keeper-reported data as a first-class input.
**Advice:**
- Start with the 2-3 highest-value tiers (e.g. aquatic, given the
  piranha population requirement) and expand incrementally rather than
  deploying to all 55 enclosures at once.

### ADR006 — Jumping Piranha Population Counting
**Decision:** Periodic manual sampling with AI-assisted photo/video
counting, rather than continuous underwater computer vision.
**Advice:**
- Validate the vision model's counting accuracy against a keeper's
  manual count over several sampling cycles before trusting it to flag
  declines unsupervised.

### ADR007 — Alert Validation & False-Positive Tolerance
**Decision:** Tiered alert severity (log-only vs. notify) with mandatory
human-in-the-loop confirmation and a continuous keeper feedback/labeling
loop.
**Advice:**
- Collect at least one full season of keeper-labeled alerts before
  attempting threshold auto-tuning.
- Define acceptance criteria (tolerable false-positive rate) with
  keeper staff directly before launch, not after complaints start.

### ADR008 — Returning Visitor Growth Mechanism
**Decision:** Launch with a simple non-AI loyalty mechanism; defer
AI-driven personalization until ticketing/popularity data exists to
inform it.
**Advice:**
- Set an explicit trigger for revisiting personalization (e.g. "after
  one full operating season of ticketing data") so it doesn't become a
  permanently deferred item.

### ADR009 — Ticketing & Family Pass Architecture
**Decision:** Off-the-shelf ticketing SaaS platform with a thin
integration layer feeding scan events into the analytics pipeline.
**Advice:**
- Evaluate 2-3 SaaS candidates specifically on webhook granularity (can
  we get a scan event per zone/attraction, not just per purchase?).

### ADR010 — Model & Provider Portability Strategy
**Decision:** Thin abstraction layer over a standard API shape for all
AI features; prefer open/self-hostable models for lower-stakes tasks.
**Advice:**
- Validate the abstraction layer early by actually swapping providers
  for one feature in a lower-stakes environment before relying on it for
  production animal-welfare features.

### ADR011 — Verification of Non-Deterministic AI Outputs
**Decision:** Human feedback loop + statistical drift monitoring in
production, plus golden-set regression testing at deploy time / after
provider changes.
**Advice:**
- Define, per AI feature, which signal (human feedback vs. drift
  monitoring) is the primary trust source, since not every feature has
  reliable human feedback available (e.g. population counting).

---

## Foundational Architecture Decisions

### ADR012 — Overall System Architecture Style
**Decision:** Event-driven, modular-service architecture over the MQTT
bus — five services (Ingestion, Popularity Analytics, Animal Monitoring,
Ticketing Integration, AI Inference), not a monolith or fine-grained
microservices.
**Advice:**
- Keep the number of services deliberately small at launch; only split
  further if a specific scaling or ownership need arises.

### ADR013 — Cloud Platform Selection
**Decision:** Single mainstream public cloud provider, managed/
serverless-first, no multi-cloud or self-hosted datacenter.
**Advice:**
- Compare 2-3 providers specifically on managed IoT/MQTT ingestion
  pricing at expected device volumes before finalizing.

### ADR014 — Data Storage Strategy
**Decision:** Purpose-fit storage per data type — time-series DB for
telemetry, relational DB for transactional/reference data, object
storage for media.
**Advice:**
- Keep to the three named storage technologies; resist adding a fourth
  without a clearly demonstrated need.

### ADR015 — IoT Device & MQTT Broker Security
**Decision:** Per-device TLS client certificates with topic-level access
control; no shared/global MQTT credentials.
**Advice:**
- Build certificate provisioning into the existing device deployment/
  installation process so it doesn't become a manual bottleneck at
  100+ device scale.

### ADR016 — Visitor & Staff Authentication and Access Control
**Decision:** Visitor auth/payment delegated to the ticketing SaaS
platform; staff access via the cloud platform's managed identity/RBAC
(Keeper, Operations, Admin roles).
**Advice:**
- Keep the staff role list minimal at launch; only add finer-grained
  roles if a real operational need emerges.

### ADR017 — Observability & Monitoring Infrastructure
**Decision:** Single shared managed observability stack (logs, metrics,
traces) across all services, with AI-specific monitoring layered on top.
**Advice:**
- Instrument correlation IDs from day one — retrofitting tracing into a
  running event-driven system is much harder than building it in from
  the start.

### ADR018 — Visitor Data Privacy & Governance
**Decision:** Data minimization and aggregation-by-default for presence
data; one documented, estate-wide retention policy.
**Advice:**
- Have the policy reviewed against applicable regional privacy
  regulation before BLE sensing goes live, given collection happens in a
  physical public venue.

### ADR019 — Disaster Recovery & Backup Strategy
**Decision:** Tiered backup strategy by data criticality — vendor DR for
payments, daily point-in-time recovery for reference data, rolling-
window backup for telemetry.
**Advice:**
- Actually test the point-in-time recovery process before go-live; an
  untested backup is not a reliable one.

### ADR020 — CI/CD & Model Deployment Pipeline
**Decision:** Single shared CI/CD pipeline with an independent deploy
path for AI models, gated by the golden-set regression suite (ADR011)
for any model/provider change.
**Advice:**
- Treat the golden-set gate as a hard blocker, not an advisory check — a
  failing model change should not be deployable without an explicit,
  logged override decision.

---

## Cross-Cutting Themes in the Advice

- **Pilot before scaling:** ADR001, ADR005, ADR006, ADR007 all call for
  validating on a small subset (one zone, a few tiers, several sampling
  cycles, one season) before estate-wide rollout.
- **Defer speculative investment until data exists:** ADR004 and ADR008
  both explicitly defer heavier builds (streaming, personalization)
  until real usage data justifies them.
- **Keep operational surface area small:** ADR012, ADR013, ADR014, and
  ADR016 each caution against over-provisioning services, roles, or
  storage technologies beyond current, demonstrated need.
- **Verify, don't assume, before trusting AI outputs unsupervised:**
  ADR006, ADR007, ADR011, and ADR020 all require an explicit validation
  step before an AI feature or model change is trusted or deployed.
