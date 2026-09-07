import { Router } from 'express';
import { query } from '../../db.js';

// Ingestion service (ADR001/ADR012). Stands in for the zone-gateway →
// LoRaWAN concentrator → MQTT broker → ingestion path: in production, events
// arrive over MQTT from real hardware; here they arrive over HTTP from a
// simulated gateway. The `buffered` flag on both tables preserves ADR001's
// store-and-forward semantics — a client marks an event `buffered: true`
// when it's replaying something queued during an outage, so downstream
// aggregation can distinguish "just happened" from "delayed delivery."
export const ingestionRouter = Router();

// POST /api/ingestion/popularity-events  { zoneId, source: "ticket_scan"|"ble_presence", occurredAt, buffered? }
ingestionRouter.post('/ingestion/popularity-events', async (req, res) => {
  const { zoneId, source, occurredAt, buffered = false } = req.body || {};
  if (!zoneId || !source || !occurredAt) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId, source, occurredAt are required.' });
  }
  if (!['ticket_scan', 'ble_presence'].includes(source)) {
    return res.status(400).json({ error: 'invalid_request', message: 'source must be ticket_scan or ble_presence.' });
  }
  const zone = await query('SELECT ble_equipped FROM zones WHERE id = $1', [zoneId]);
  if (zone.rows.length === 0) return res.status(404).json({ error: 'zone_not_found' });
  if (source === 'ble_presence' && !zone.rows[0].ble_equipped) {
    // ADR003: BLE fallback — zone isn't BLE-equipped, so this event type isn't valid here.
    return res.status(422).json({ error: 'zone_not_ble_equipped', message: 'This zone falls back to ticket-scan-only (ADR003).' });
  }

  const { rows } = await query(
    `INSERT INTO popularity_events (zone_id, source, occurred_at, buffered) VALUES ($1, $2, $3, $4) RETURNING *`,
    [zoneId, source, occurredAt, buffered]
  );
  res.status(201).json(rows[0]);
});

// POST /api/ingestion/sensor-readings  { zoneId, metric, value, recordedAt, buffered? }
ingestionRouter.post('/ingestion/sensor-readings', async (req, res) => {
  const { zoneId, metric, value, recordedAt, buffered = false } = req.body || {};
  if (!zoneId || !metric || value === undefined || !recordedAt) {
    return res.status(400).json({ error: 'invalid_request', message: 'zoneId, metric, value, recordedAt are required.' });
  }
  const { rows } = await query(
    `INSERT INTO sensor_readings (zone_id, metric, value, recorded_at, buffered) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [zoneId, metric, value, recordedAt, buffered]
  );
  res.status(201).json(rows[0]);
});
