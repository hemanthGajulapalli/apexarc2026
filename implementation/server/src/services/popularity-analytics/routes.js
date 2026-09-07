import { Router } from 'express';
import { query, withTransaction } from '../../db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { rollupHourly, rollupDaily, naiveForecast } from './aggregation.js';

// Popularity Analytics service (ADR003/ADR004) + Ops AI forecasting and
// recommendations (ADR021). Maps to ops-dashboard-wireframe.html.
export const popularityRouter = Router();

// GET /api/popularity/zones — ranked by latest hourly count (screen-overview hot zones)
popularityRouter.get('/popularity/zones', async (_req, res) => {
  const { rows } = await query(`
    SELECT z.id, z.name, z.zone_type, z.ble_equipped,
           COALESCE(latest.event_count, 0) AS latest_hour_count
    FROM zones z
    LEFT JOIN LATERAL (
      SELECT event_count FROM popularity_aggregates_hourly
      WHERE zone_id = z.id ORDER BY hour_bucket DESC LIMIT 1
    ) latest ON true
    ORDER BY latest_hour_count DESC
  `);
  res.json(rows);
});

// GET /api/popularity/zones/:id — hourly series for drill-down (screen-zone)
popularityRouter.get('/popularity/zones/:id', async (req, res) => {
  const zone = await query('SELECT * FROM zones WHERE id = $1', [req.params.id]);
  if (zone.rows.length === 0) return res.status(404).json({ error: 'zone_not_found' });

  const series = await query(
    `SELECT hour_bucket, event_count FROM popularity_aggregates_hourly
     WHERE zone_id = $1 ORDER BY hour_bucket DESC LIMIT 24`,
    [req.params.id]
  );
  res.json({ zone: zone.rows[0], hourly: series.rows.reverse() });
});

// POST /api/popularity/aggregate  { zoneId, hourBucket, dayBucket }
// Triggers a real rollup — in production this runs on a schedule (ADR004),
// exposed here as an endpoint so it's directly testable and demoable.
popularityRouter.post('/popularity/aggregate', async (req, res) => {
  const { zoneId, hourBucket, dayBucket } = req.body || {};
  if (!zoneId || !hourBucket) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId and hourBucket are required.' });
  }
  const hourly = await rollupHourly(zoneId, hourBucket);
  let daily = null;
  if (dayBucket) daily = await rollupDaily(zoneId, dayBucket);
  res.json({ hourly, daily });
});

// GET /api/popularity/forecast?zoneId=&for=ISO_TIMESTAMP
popularityRouter.get('/popularity/forecast', async (req, res) => {
  const { zoneId, for: forecastFor } = req.query;
  if (!zoneId || !forecastFor) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId and for are required query params.' });
  }
  const forecast = await naiveForecast(zoneId, forecastFor);
  res.json(forecast);
});

// GET /api/popularity/recommendations — Operations/Admin only (screen-decisions)
popularityRouter.get('/popularity/recommendations', requireRole('operations', 'admin'), async (req, res) => {
  const { kind } = req.query;
  const params = [];
  let where = '';
  if (kind) {
    params.push(kind);
    where = 'WHERE r.kind = $1';
  }
  const { rows } = await query(
    `SELECT r.*, z.name AS zone_name FROM recommendations r
     JOIN zones z ON z.id = r.zone_id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  );
  res.json(rows);
});

// POST /api/popularity/recommendations/:id/approve  { note }
// ADR007/ADR021: mandatory human approval, enforced server-side — this is
// the actual guardrail, not just a UI affordance. A blocked recommendation
// (e.g. stale zone data) cannot be approved until it's unblocked.
popularityRouter.post('/popularity/recommendations/:id/approve', requireRole('operations', 'admin'), async (req, res) => {
  const { note } = req.body || {};
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'An approval note is required (ADR007).' });
  }

  const result = await withTransaction(async (client) => {
    const rec = await client.query('SELECT * FROM recommendations WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (rec.rows.length === 0) return { status: 404 };
    if (rec.rows[0].status === 'blocked') {
      return { status: 409, error: 'blocked', message: rec.rows[0].blocked_reason || 'Recommendation is blocked and cannot be approved.' };
    }
    if (rec.rows[0].status === 'approved') {
      return { status: 409, error: 'already_approved' };
    }
    const updated = await client.query(
      `UPDATE recommendations SET status = 'approved', approved_by = $1, approved_note = $2, approved_at = now()
       WHERE id = $3 RETURNING *`,
      [req.user.id, note.trim(), req.params.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'recommendation.approve', 'recommendations', req.params.id, note.trim()]
    );
    return { status: 200, body: updated.rows[0] };
  });

  if (result.status === 404) return res.status(404).json({ error: 'not_found' });
  if (result.status === 409) return res.status(409).json({ error: result.error, message: result.message });
  res.json(result.body);
});
