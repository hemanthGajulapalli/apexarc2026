-- =============================================================================
-- Von Digitalis Estates — Database Schema
-- =============================================================================
-- Target engine: PostgreSQL 14+ (matches ADR013 — single managed cloud provider,
-- ADR014 — purpose-fit storage per data type).
--
-- ADR014 calls for THREE storage technologies. This schema implements the
-- relational portion in full. The other two are represented here for
-- documentation completeness, with a note on how each maps in production:
--   1. RELATIONAL (this file, in full)        — reference/transactional data:
--      identity, tickets, enclosures, alerts, models, audit trails.
--   2. TIME-SERIES (modeled here as regular Postgres tables, indexed by time;
--      see "TIME-SERIES DOMAIN" section below) — in production this is a
--      dedicated TSDB (e.g. TimescaleDB/InfluxDB) per ADR014/ADR021. The
--      schema and query shape are unchanged either way — only the storage
--      engine differs — so this local dev setup models it faithfully with
--      standard tables + time-bucketed indexes rather than faking it.
--   3. OBJECT STORAGE — piranha capture photos/video (ADR014, UC03). Not a
--      SQL concern; see implementation/server/src/services/animal-monitoring
--      for the local-filesystem stand-in and its production (S3-compatible)
--      equivalent, referenced from population_counts.capture_object_key.
--
-- Every table that represents a human-in-the-loop decision (ADR007) carries
-- its own resolved_by / resolved_at / resolution_note columns rather than
-- relying solely on the shared audit_log — the audit_log exists in ADDITION,
-- for cross-service reporting, not as the only record.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- IDENTITY & ACCESS (ADR016 — OAuth/OIDC for visitors and staff, RBAC for staff)
-- -----------------------------------------------------------------------------

CREATE TYPE user_kind AS ENUM ('visitor', 'staff');
CREATE TYPE staff_role AS ENUM ('keeper', 'operations', 'admin');
CREATE TYPE oauth_provider AS ENUM ('google', 'apple', 'estate');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind            user_kind NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    oauth_provider  oauth_provider NOT NULL,
    oauth_subject   TEXT NOT NULL,            -- provider-side subject id (ADR016: identity decoupled from ticketing)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (oauth_provider, oauth_subject)
);

-- Staff RBAC (ADR016 advice: keep this role list minimal — Keeper/Operations/Admin only)
CREATE TABLE staff_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            staff_role NOT NULL,
    scope_note      TEXT,                     -- e.g. "Aquatic + Reptile tiers" — informational, not enforced
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- -----------------------------------------------------------------------------
-- ESTATE TOPOLOGY — zones, rides, enclosures (shared by UC01/UC02/UC03)
-- -----------------------------------------------------------------------------

CREATE TYPE zone_type AS ENUM ('ride', 'enclosure');
CREATE TYPE species_tier AS ENUM ('mammal', 'reptile_land', 'aquatic');

CREATE TABLE zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    zone_type       zone_type NOT NULL,
    ble_equipped    BOOLEAN NOT NULL DEFAULT false,   -- ADR003: BLE only in a small subset of high-value zones
    gateway_id      TEXT NOT NULL,                    -- which of the 3 LoRaWAN concentrators (ADR001)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enclosures (
    zone_id         UUID PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
    species_tier    species_tier NOT NULL,             -- ADR005
    capacity        INTEGER,
    baseline_feed_g INTEGER                            -- expected daily feed amount, per keeper baseline
);

-- -----------------------------------------------------------------------------
-- TICKETING & LOYALTY (ADR009 — payment/issuance only; ADR008 — Phase One loyalty)
-- -----------------------------------------------------------------------------

CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id      UUID NOT NULL REFERENCES users(id),
    visit_date      DATE NOT NULL,
    adults          INTEGER NOT NULL DEFAULT 0,
    children        INTEGER NOT NULL DEFAULT 0,
    add_ons         TEXT[],                            -- e.g. {parking, skip_the_line}
    promo_code      TEXT,
    total_price     NUMERIC(10,2) NOT NULL,
    purchased_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual family-pass entries, attributed to a zone at scan time
-- (UC01 alt-flow: "each entry within a family pass attributed correctly").
CREATE TABLE ticket_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    zone_id         UUID NOT NULL REFERENCES zones(id),
    scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loyalty_accounts (
    visitor_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    member_since    TIMESTAMPTZ NOT NULL DEFAULT now(),
    active_perk     TEXT NOT NULL DEFAULT '10% off next visit',   -- ADR008 Phase One
    personalization_opt_in BOOLEAN NOT NULL DEFAULT true          -- ADR018 — opt-out, default on
);

-- -----------------------------------------------------------------------------
-- TIME-SERIES DOMAIN — popularity + sensor telemetry (ADR001/003/004/014)
-- Modeled as regular tables with time-bucketed indexes; production swaps the
-- storage engine, not the shape.
-- -----------------------------------------------------------------------------

CREATE TYPE popularity_event_source AS ENUM ('ticket_scan', 'ble_presence');

CREATE TABLE popularity_events (
    id              BIGSERIAL PRIMARY KEY,
    zone_id         UUID NOT NULL REFERENCES zones(id),
    source          popularity_event_source NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),   -- may lag occurred_at during a gateway outage (ADR001)
    buffered        BOOLEAN NOT NULL DEFAULT false         -- true if delivered late via store-and-forward
);
CREATE INDEX idx_popularity_events_zone_time ON popularity_events (zone_id, occurred_at);

CREATE TABLE popularity_aggregates_hourly (
    zone_id         UUID NOT NULL REFERENCES zones(id),
    hour_bucket     TIMESTAMPTZ NOT NULL,
    event_count     INTEGER NOT NULL,
    PRIMARY KEY (zone_id, hour_bucket)
);

CREATE TABLE popularity_aggregates_daily (
    zone_id         UUID NOT NULL REFERENCES zones(id),
    day_bucket      DATE NOT NULL,
    event_count     INTEGER NOT NULL,
    PRIMARY KEY (zone_id, day_bucket)
);

CREATE TYPE sensor_metric AS ENUM ('activity_score', 'weight_g', 'water_temp_c', 'motion_last_seen_min');

CREATE TABLE sensor_readings (
    id              BIGSERIAL PRIMARY KEY,
    zone_id         UUID NOT NULL REFERENCES zones(id),
    metric          sensor_metric NOT NULL,
    value           NUMERIC NOT NULL,
    recorded_at     TIMESTAMPTZ NOT NULL,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    buffered        BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_sensor_readings_zone_time ON sensor_readings (zone_id, recorded_at);

-- -----------------------------------------------------------------------------
-- FORECASTING & RECOMMENDATIONS (ADR021 — "Ops AI")
-- -----------------------------------------------------------------------------

CREATE TABLE popularity_forecasts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zones(id),
    model_id        UUID NOT NULL,                        -- FK to models(id), added after models table below
    forecast_for    TIMESTAMPTZ NOT NULL,
    predicted_count INTEGER NOT NULL,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE recommendation_kind AS ENUM ('staff_deploy', 'investment');
CREATE TYPE recommendation_status AS ENUM ('pending', 'approved', 'blocked');

CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind            recommendation_kind NOT NULL,
    zone_id         UUID NOT NULL REFERENCES zones(id),
    model_id        UUID NOT NULL,
    title           TEXT NOT NULL,
    rationale       TEXT NOT NULL,
    confidence      NUMERIC(4,3) NOT NULL,                 -- 0..1
    status          recommendation_status NOT NULL DEFAULT 'pending',
    blocked_reason  TEXT,                                  -- e.g. "stale zone data"
    approved_by     UUID REFERENCES users(id),              -- ADR007/ADR021: mandatory human approval
    approved_note   TEXT,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- ANIMAL HEALTH & FEEDING (ADR002/005/007) + POPULATION COUNTING (ADR006)
-- -----------------------------------------------------------------------------

CREATE TYPE alert_severity AS ENUM ('critical', 'warn', 'info');
CREATE TYPE alert_status AS ENUM ('logged', 'notified', 'confirmed', 'dismissed');
CREATE TYPE alert_origin AS ENUM ('edge_threshold', 'cloud_model');   -- ADR002: which inference path raised it

CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zones(id),
    alert_type      TEXT NOT NULL,                         -- e.g. "eating_anomaly", "low_appetite_trend"
    severity        alert_severity NOT NULL,
    origin          alert_origin NOT NULL,
    model_id        UUID,                                  -- null when origin = edge_threshold (no model, ADR002)
    confidence      NUMERIC(4,3),
    grounding       TEXT,                                  -- what sensor/data the alert cites
    status          alert_status NOT NULL DEFAULT 'logged',
    resolved_by     UUID REFERENCES users(id),              -- ADR007: every notified alert gets a keeper label
    resolution_note TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE treatments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    proposed_plan   TEXT NOT NULL,
    confidence      NUMERIC(4,3),
    approved_by     UUID REFERENCES users(id),              -- vet/keeper confirmation, ADR007
    approved_note   TEXT,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feeding_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zones(id),
    amount_g        INTEGER NOT NULL,
    behavior_notes  TEXT,
    logged_by       UUID NOT NULL REFERENCES users(id),     -- ADR005: keeper-logged data is a first-class input
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE population_review_status AS ENUM ('pending', 'confirmed_decline', 'dismissed');

CREATE TABLE population_counts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id              UUID NOT NULL REFERENCES zones(id),
    model_id             UUID NOT NULL,
    vision_count         INTEGER NOT NULL,
    previous_count       INTEGER,
    confidence           NUMERIC(4,3) NOT NULL,
    capture_object_key   TEXT,                              -- object storage reference (ADR014); see server README
    manual_cross_check   INTEGER,
    review_status        population_review_status NOT NULL DEFAULT 'pending',
    reviewed_by          UUID REFERENCES users(id),
    review_note          TEXT,
    reviewed_at          TIMESTAMPTZ,
    captured_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- PERSONALIZATION & CONCIERGE (ADR022, gated by ADR008's Phase Two trigger)
-- -----------------------------------------------------------------------------

CREATE TABLE personalized_offers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id      UUID NOT NULL REFERENCES users(id),
    model_id        UUID NOT NULL,
    offer_text      TEXT NOT NULL,
    grounding       TEXT NOT NULL,                          -- what visitor/estate data it's grounded in
    confidence      NUMERIC(4,3) NOT NULL,
    presented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    engaged         BOOLEAN,                                 -- null = not yet observed, true/false = clicked or not
    engaged_at      TIMESTAMPTZ
);

CREATE TABLE concierge_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id      UUID REFERENCES users(id),
    model_id        UUID NOT NULL,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    grounding       TEXT NOT NULL,
    confidence      NUMERIC(4,3) NOT NULL,
    asked_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- AI GOVERNANCE (ADR011 verification, ADR020 hard CI/CD deploy gate)
-- -----------------------------------------------------------------------------

CREATE TYPE model_status AS ENUM ('production', 'candidate', 'blocked', 'retired');

CREATE TABLE models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                          -- e.g. "Health & Feeding AI", "Piranha-Count", "Ops AI", "Customer GenAI"
    version         TEXT NOT NULL,
    governing_adr   TEXT NOT NULL,                           -- e.g. "ADR005", "ADR021" — every tracked model must cite one
    status          model_status NOT NULL DEFAULT 'candidate',
    golden_set_score      NUMERIC(4,3),
    golden_set_threshold  NUMERIC(4,3) NOT NULL,
    drift_status    TEXT NOT NULL DEFAULT 'nominal',          -- nominal | watch | breach
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, version)
);

-- add the FKs deferred above now that models exists
ALTER TABLE popularity_forecasts ADD CONSTRAINT fk_forecast_model FOREIGN KEY (model_id) REFERENCES models(id);
ALTER TABLE recommendations      ADD CONSTRAINT fk_rec_model       FOREIGN KEY (model_id) REFERENCES models(id);
ALTER TABLE alerts               ADD CONSTRAINT fk_alert_model     FOREIGN KEY (model_id) REFERENCES models(id);
ALTER TABLE population_counts    ADD CONSTRAINT fk_pop_model       FOREIGN KEY (model_id) REFERENCES models(id);
ALTER TABLE personalized_offers  ADD CONSTRAINT fk_offer_model     FOREIGN KEY (model_id) REFERENCES models(id);
ALTER TABLE concierge_queries    ADD CONSTRAINT fk_query_model     FOREIGN KEY (model_id) REFERENCES models(id);

-- Per-category golden-set breakdown (the "test result analysis" the AI
-- Governance Console wireframe shows before any deploy decision).
CREATE TABLE golden_set_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    overall_score   NUMERIC(4,3) NOT NULL,
    passed          BOOLEAN NOT NULL,
    run_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE golden_set_category_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id          UUID NOT NULL REFERENCES golden_set_runs(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,
    tests_total     INTEGER NOT NULL,
    tests_passed    INTEGER NOT NULL,
    score           NUMERIC(4,3) NOT NULL
);

CREATE TABLE drift_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    measured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    score           NUMERIC(4,3) NOT NULL
);

CREATE TYPE deploy_result AS ENUM ('pass', 'fail');

CREATE TABLE deploy_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    result          deploy_result NOT NULL,
    promoted_by     UUID REFERENCES users(id),               -- ADR020: human-reviewed promotion, even on pass
    promoted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A failing golden-set result is a hard blocker (ADR020); this table is the
-- ONLY way a blocked model can still reach production, and it is never
-- optional — the API enforces that every field here is populated.
CREATE TABLE deploy_overrides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    approver_id     UUID NOT NULL REFERENCES users(id),
    justification   TEXT NOT NULL,
    golden_set_score_at_override NUMERIC(4,3) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- CROSS-CUTTING AUDIT LOG (supplementary to the per-domain resolution columns
-- above — used for unified reporting/testing, not the sole record of truth)
-- -----------------------------------------------------------------------------

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        UUID REFERENCES users(id),
    action          TEXT NOT NULL,               -- e.g. "alert.confirm", "recommendation.approve", "model.override"
    entity_table    TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    note            TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_table, entity_id);
