import { Router } from 'express';
import { query, withTransaction } from '../../db.js';
import { requireRole } from '../../middleware/auth.js';
import { tierSeverity, initialStatusForSeverity } from './alertTiering.js';

// Animal Monitoring service (ADR002/ADR005/ADR006/ADR007). Maps to
// vet-console-wireframe.html. Every state-changing endpoint here requires a
// keeper's identity + a note — that is ADR007's guardrail enforced in code,
// not just shown in a UI: there is no code path that resolves an alert
// without both.
export const animalMonitoringRouter = Router();

// POST /api/animal-health/alerts  — system/model-originated (edge threshold
// or cloud model), NOT a keeper action. In production this is called by the
// gateway (edge_threshold, no auth) or the cloud anomaly model (cloud_model).
animalMonitoringRouter.post('/animal-health/alerts', async (req, res) => {
  const { zoneId, alertType, origin, confidence, modelId, grounding } = req.body || {};
  if (!zoneId || !alertType || !origin) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId, alertType, origin are required.' });
  }
  if (!['edge_threshold', 'cloud_model'].includes(origin)) {
    return res.status(400).json({ error: 'invalid_request', message: 'origin must be edge_threshold or cloud_model.' });
  }
  // Edge-threshold alerts (ADR002) are simple rule breaches, not model
  // output — they're always urgent by definition, independent of confidence.
  const severity = origin === 'edge_threshold' ? 'critical' : tierSeverity(confidence ?? 0);
  const status = origin === 'edge_threshold' ? 'notified' : initialStatusForSeverity(severity);

  const { rows } = await query(
    `INSERT INTO alerts (zone_id, alert_type, severity, origin, model_id, confidence, grounding, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [zoneId, alertType, severity, origin, modelId || null, confidence ?? null, grounding || null, status]
  );
  res.status(201).json(rows[0]);
});

// GET /api/animal-health/alerts — Keeper (or Operations/Admin) view
animalMonitoringRouter.get('/animal-health/alerts', requireRole('keeper', 'operations', 'admin'), async (req, res) => {
  const { rows } = await query(
    `SELECT a.*, z.name AS zone_name FROM alerts a JOIN zones z ON z.id = a.zone_id
     ORDER BY a.created_at DESC`
  );
  res.json(rows);
});

async function resolveAlert(req, res, targetStatus) {
  const { note } = req.body || {};
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'A keeper note is required to label this alert (ADR007).' });
  }
  const result = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM alerts WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (existing.rows.length === 0) return { status: 404 };
    if (existing.rows[0].status === 'confirmed' || existing.rows[0].status === 'dismissed') {
      return { status: 409, message: 'Alert has already been labeled.' };
    }
    const updated = await client.query(
      `UPDATE alerts SET status = $1, resolved_by = $2, resolution_note = $3, resolved_at = now()
       WHERE id = $4 RETURNING *`,
      [targetStatus, req.user.id, note.trim(), req.params.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, $2, 'alerts', $3, $4)`,
      [req.user.id, `alert.${targetStatus}`, req.params.id, note.trim()]
    );
    return { status: 200, body: updated.rows[0] };
  });
  if (result.status === 404) return res.status(404).json({ error: 'not_found' });
  if (result.status === 409) return res.status(409).json({ error: 'already_labeled', message: result.message });
  res.json(result.body);
}

// POST /api/animal-health/alerts/:id/confirm  { note }  — true positive
animalMonitoringRouter.post('/animal-health/alerts/:id/confirm', requireRole('keeper'), (req, res) => resolveAlert(req, res, 'confirmed'));

// POST /api/animal-health/alerts/:id/dismiss  { note }  — false positive
// This endpoint is the fix for the gap found auditing the wireframes: the
// UI previously had no false-positive path for animal-health alerts at all.
// Here, it's the OTHER symmetric half of resolveAlert — impossible to ship
// the confirm path without it.
animalMonitoringRouter.post('/animal-health/alerts/:id/dismiss', requireRole('keeper'), (req, res) => resolveAlert(req, res, 'dismissed'));

// POST /api/animal-health/alerts/:id/treatment  { plan, note }
animalMonitoringRouter.post('/animal-health/alerts/:id/treatment', requireRole('keeper'), async (req, res) => {
  const { plan, note, confidence } = req.body || {};
  if (!plan || !note || !note.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'plan and an approval note are required.' });
  }
  const alert = await query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
  if (alert.rows.length === 0) return res.status(404).json({ error: 'not_found' });
  if (alert.rows[0].status !== 'confirmed') {
    return res.status(409).json({ error: 'not_confirmed', message: 'An alert must be confirmed before a treatment can be approved (ADR007).' });
  }

  const { rows } = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO treatments (alert_id, proposed_plan, confidence, approved_by, approved_note, approved_at)
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [req.params.id, plan, confidence ?? null, req.user.id, note.trim()]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, 'treatment.approve', 'treatments', $2, $3)`,
      [req.user.id, inserted.rows[0].id, note.trim()]
    );
    return inserted;
  });
  res.status(201).json(rows[0]);
});

// POST /api/animal-health/feeding-logs  { zoneId, amountG, behaviorNotes }
animalMonitoringRouter.post('/animal-health/feeding-logs', requireRole('keeper'), async (req, res) => {
  const { zoneId, amountG, behaviorNotes } = req.body || {};
  if (!zoneId || amountG === undefined) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId and amountG are required.' });
  }
  const { rows } = await query(
    `INSERT INTO feeding_logs (zone_id, amount_g, behavior_notes, logged_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [zoneId, amountG, behaviorNotes || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// GET /api/animal-health/population/:zoneId — latest count + capture history
animalMonitoringRouter.get('/animal-health/population/:zoneId', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM population_counts WHERE zone_id = $1 ORDER BY captured_at DESC`,
    [req.params.zoneId]
  );
  res.json(rows);
});

// POST /api/animal-health/population/:zoneId/capture  { visionCount, confidence, captureObjectKey, modelId }
// ADR006/ADR014: photo/video captured, vision model estimates a count. In
// production the file itself goes to object storage; this API only stores
// the reference key, matching how population_counts.capture_object_key is
// modeled in the schema.
animalMonitoringRouter.post('/animal-health/population/:zoneId/capture', requireRole('keeper'), async (req, res) => {
  const { visionCount, confidence, captureObjectKey, modelId } = req.body || {};
  if (visionCount === undefined || confidence === undefined || !modelId) {
    return res.status(400).json({ error: 'invalid_request', message: 'visionCount, confidence, modelId are required.' });
  }
  const previous = await query(
    `SELECT vision_count FROM population_counts WHERE zone_id = $1 ORDER BY captured_at DESC LIMIT 1`,
    [req.params.zoneId]
  );
  const { rows } = await query(
    `INSERT INTO population_counts (zone_id, model_id, vision_count, previous_count, confidence, capture_object_key)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.zoneId, modelId, visionCount, previous.rows[0]?.vision_count ?? null, confidence, captureObjectKey || null]
  );
  res.status(201).json(rows[0]);
});

// POST /api/animal-health/population/:id/review  { decision, note, manualCrossCheck }
animalMonitoringRouter.post('/animal-health/population/:id/review', requireRole('keeper'), async (req, res) => {
  const { decision, note, manualCrossCheck } = req.body || {};
  if (!['confirmed_decline', 'dismissed'].includes(decision)) {
    return res.status(400).json({ error: 'invalid_request', message: 'decision must be confirmed_decline or dismissed.' });
  }
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'A keeper note is required (ADR007).' });
  }
  const result = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM population_counts WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (existing.rows.length === 0) return { status: 404 };
    if (existing.rows[0].review_status !== 'pending') {
      return { status: 409, message: 'This count has already been reviewed.' };
    }
    const updated = await client.query(
      `UPDATE population_counts SET review_status = $1, reviewed_by = $2, review_note = $3, manual_cross_check = $4, reviewed_at = now()
       WHERE id = $5 RETURNING *`,
      [decision, req.user.id, note.trim(), manualCrossCheck ?? null, req.params.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, $2, 'population_counts', $3, $4)`,
      [req.user.id, `population.${decision}`, req.params.id, note.trim()]
    );
    return { status: 200, body: updated.rows[0] };
  });
  if (result.status === 404) return res.status(404).json({ error: 'not_found' });
  if (result.status === 409) return res.status(409).json({ error: 'already_reviewed', message: result.message });
  res.json(result.body);
});
