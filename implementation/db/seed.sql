-- =============================================================================
-- Seed data — matches the content already established in the wireframes
-- (wireframes/*.html) so the running webapp continues the same story rather
-- than introducing new, disconnected example data.
-- =============================================================================

-- Staff users + RBAC assignments (ADR016)
INSERT INTO users (id, kind, email, display_name, oauth_provider, oauth_subject) VALUES
    ('11111111-1111-1111-1111-111111111101', 'staff', 'amara.osei@vondigitalis.example', 'Amara Osei', 'estate', 'staff-amara'),
    ('11111111-1111-1111-1111-111111111102', 'staff', 'jonas.meyer@vondigitalis.example', 'Jonas Meyer', 'estate', 'staff-jonas'),
    ('11111111-1111-1111-1111-111111111103', 'staff', 'priya.nair@vondigitalis.example', 'Priya Nair', 'estate', 'staff-priya');

INSERT INTO staff_assignments (user_id, role, scope_note) VALUES
    ('11111111-1111-1111-1111-111111111101', 'keeper', 'Aquatic + Reptile tiers'),
    ('11111111-1111-1111-1111-111111111102', 'operations', 'Estate-wide'),
    ('11111111-1111-1111-1111-111111111103', 'admin', 'Estate-wide + governance console');

-- A sample visitor (ADR016: OAuth identity, decoupled from payment)
INSERT INTO users (id, kind, email, display_name, oauth_provider, oauth_subject) VALUES
    ('22222222-2222-2222-2222-222222222201', 'visitor', 'visitor@example.com', 'Returning Visitor', 'google', 'visitor-demo-1');

INSERT INTO loyalty_accounts (visitor_id, member_since, active_perk) VALUES
    ('22222222-2222-2222-2222-222222222201', '2026-09-01', '10% off next visit');

-- Zones — rides and enclosures (matches wireframe content: Piranha Falls,
-- Raptor Aviary, Terra Domes for rides/attractions; Enclosure 12/33/41/07)
INSERT INTO zones (id, name, zone_type, ble_equipped, gateway_id) VALUES
    ('33333333-3333-3333-3333-333333333301', 'Piranha Falls', 'ride', true,  'gw-1'),
    ('33333333-3333-3333-3333-333333333302', 'Raptor Aviary', 'ride', false, 'gw-1'),
    ('33333333-3333-3333-3333-333333333303', 'Terra Domes', 'ride', false, 'gw-2'),
    ('33333333-3333-3333-3333-333333333304', 'Vintage Carousel', 'ride', false, 'gw-2'),
    ('33333333-3333-3333-3333-333333333305', 'Exotic Aquarium Hall', 'ride', true, 'gw-3'),
    ('44444444-4444-4444-4444-444444444412', 'Enclosure 12 — Reptile House', 'enclosure', false, 'gw-1'),
    ('44444444-4444-4444-4444-444444444433', 'Enclosure 33 — Mammal Barn', 'enclosure', false, 'gw-2'),
    ('44444444-4444-4444-4444-444444444441', 'Enclosure 41 — Piranha Tank', 'enclosure', true,  'gw-1'),
    ('44444444-4444-4444-4444-444444444407', 'Enclosure 07 — Aquatic Hall', 'enclosure', true,  'gw-3');

INSERT INTO enclosures (zone_id, species_tier, capacity, baseline_feed_g) VALUES
    ('44444444-4444-4444-4444-444444444412', 'reptile_land', 40, 200),
    ('44444444-4444-4444-4444-444444444433', 'mammal', 25, 150),
    ('44444444-4444-4444-4444-444444444441', 'aquatic', 150, 400),
    ('44444444-4444-4444-4444-444444444407', 'aquatic', 60, 300);

-- Models (ADR011/ADR020/ADR021/ADR022 — matches AI Governance Console wireframe)
INSERT INTO models (id, name, version, governing_adr, status, golden_set_score, golden_set_threshold, drift_status) VALUES
    ('55555555-5555-5555-5555-555555555501', 'Health & Feeding AI', 'v7.2', 'ADR005', 'production', 0.94, 0.90, 'nominal'),
    ('55555555-5555-5555-5555-555555555502', 'Health & Feeding AI', 'v7.1', 'ADR005', 'retired',    0.91, 0.90, 'nominal'),
    ('55555555-5555-5555-5555-555555555503', 'Piranha-Count', 'v3.1', 'ADR006', 'production', 0.88, 0.85, 'watch'),
    ('55555555-5555-5555-5555-555555555504', 'Piranha-Count', 'v3.2', 'ADR006', 'blocked',    0.81, 0.85, 'watch'),
    ('55555555-5555-5555-5555-555555555505', 'Piranha-Count', 'v3.0', 'ADR006', 'retired',    0.90, 0.85, 'nominal'),
    ('55555555-5555-5555-5555-555555555506', 'Ops AI', 'v7.2', 'ADR021', 'production', 0.90, 0.85, 'nominal'),
    ('55555555-5555-5555-5555-555555555507', 'Customer GenAI', 'v1.0', 'ADR022', 'production', 0.88, 0.80, 'nominal');

INSERT INTO golden_set_runs (id, model_id, overall_score, passed, run_at) VALUES
    ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555504', 0.81, false, '2026-09-05 10:00:00+05:30');

INSERT INTO golden_set_category_results (run_id, category, tests_total, tests_passed, score) VALUES
    ('66666666-6666-6666-6666-666666666601', 'Clear water', 40, 39, 0.97),
    ('66666666-6666-6666-6666-666666666601', 'Turbid / low visibility', 30, 21, 0.70),
    ('66666666-6666-6666-6666-666666666601', 'Occlusion (overlapping fish)', 25, 19, 0.76),
    ('66666666-6666-6666-6666-666666666601', 'Low light', 25, 22, 0.88);

INSERT INTO deploy_log (model_id, result, promoted_by, promoted_at) VALUES
    ('55555555-5555-5555-5555-555555555505', 'pass', '11111111-1111-1111-1111-111111111103', '2026-07-02 09:00:00+05:30'),
    ('55555555-5555-5555-5555-555555555503', 'pass', '11111111-1111-1111-1111-111111111103', '2026-08-11 09:00:00+05:30'),
    ('55555555-5555-5555-5555-555555555504', 'fail', NULL, NULL),
    ('55555555-5555-5555-5555-555555555502', 'pass', '11111111-1111-1111-1111-111111111103', '2026-08-20 09:00:00+05:30'),
    ('55555555-5555-5555-5555-555555555501', 'pass', '11111111-1111-1111-1111-111111111103', '2026-09-02 09:00:00+05:30'),
    ('55555555-5555-5555-5555-555555555507', 'pass', '11111111-1111-1111-1111-111111111103', '2026-09-03 09:00:00+05:30'),
    ('55555555-5555-5555-5555-555555555506', 'pass', '11111111-1111-1111-1111-111111111103', '2026-09-04 09:00:00+05:30');

-- Sample animal health alerts (matches Vet Console wireframe content)
INSERT INTO alerts (id, zone_id, alert_type, severity, origin, model_id, confidence, grounding, status, created_at) VALUES
    ('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444441', 'eating_anomaly', 'critical', 'cloud_model', '55555555-5555-5555-5555-555555555501', 0.95, 'feeding camera + weight telemetry', 'notified', now() - interval '2 minutes'),
    ('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444433', 'low_appetite_trend', 'warn', 'cloud_model', '55555555-5555-5555-5555-555555555501', 0.78, '7-day feeding history', 'notified', now() - interval '12 minutes'),
    ('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444412', 'activity_back_to_baseline', 'info', 'cloud_model', '55555555-5555-5555-5555-555555555501', 0.64, 'motion + heart-rate telemetry', 'logged', now() - interval '31 minutes');

-- Feeding logs
INSERT INTO feeding_logs (zone_id, amount_g, behavior_notes, logged_by, logged_at) VALUES
    ('44444444-4444-4444-4444-444444444433', 120, 'less active than usual', '11111111-1111-1111-1111-111111111101', now() - interval '1 day');

-- Population count (matches Vet Console population-review screen)
INSERT INTO population_counts (id, zone_id, model_id, vision_count, previous_count, confidence, capture_object_key, review_status, captured_at) VALUES
    ('88888888-8888-8888-8888-888888888801', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555503', 34, 37, 0.60, 'captures/enclosure-41/2026-09-01.jpg', 'pending', now() - interval '6 days');

-- Ops AI recommendations (matches Ops Dashboard Decision Panel wireframe)
INSERT INTO recommendations (id, kind, zone_id, model_id, title, rationale, confidence, status) VALUES
    ('99999999-9999-9999-9999-999999999901', 'staff_deploy', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555506', 'Move 3 hosts to Piranha Falls 14:00-16:00', 'impact: +1,120 visitors served, cost: $0 (reallocation)', 0.80, 'pending'),
    ('99999999-9999-9999-9999-999999999902', 'staff_deploy', '33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555506', 'Open Raptor Aviary overflow entrance 13:00', 'impact: -40 min queue, cost: $0 — manual review recommended', 0.40, 'pending'),
    ('99999999-9999-9999-9999-999999999903', 'staff_deploy', '33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555506', 'Add gates at Terra Domes 15:00', 'blocked: stale zone data', 0.0, 'blocked'),
    ('99999999-9999-9999-9999-999999999904', 'investment', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555506', 'Invest $180k: water feature at Piranha Falls', 'predicted lift: +8% yearly visitors, payback: 4yr', 0.80, 'pending');

UPDATE recommendations SET blocked_reason = 'stale zone data' WHERE id = '99999999-9999-9999-9999-999999999903';
