import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/db.js';
import { bootApp, api, createStaffUser, createTestZone, createTestModel, createVisitor } from './testHelpers.js';
import { rollupHourly, naiveForecast } from '../src/services/popularity-analytics/aggregation.js';

async function seedRecommendation(zoneId, modelId, overrides = {}) {
  const { rows } = await query(
    `INSERT INTO recommendations (kind, zone_id, model_id, title, rationale, confidence, status, blocked_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      overrides.kind || 'staff_deploy',
      zoneId, modelId,
      overrides.title || 'Move 2 hosts',
      overrides.rationale || 'impact: queue -20min',
      overrides.confidence ?? 0.8,
      overrides.status || 'pending',
      overrides.blockedReason || null,
    ]
  );
  return rows[0];
}

async function addPopularityEvent(zoneId, occurredAt) {
  await query(`INSERT INTO popularity_events (zone_id, source, occurred_at) VALUES ($1, 'ticket_scan', $2)`, [zoneId, occurredAt]);
}

describe('Popularity Analytics — aggregation (ADR004)', () => {
  test('rollupHourly counts exactly the events within the hour window, not outside it', async () => {
    const zone = await createTestZone();
    const hour = new Date('2026-09-01T14:00:00Z');
    await addPopularityEvent(zone.id, new Date('2026-09-01T14:05:00Z').toISOString());
    await addPopularityEvent(zone.id, new Date('2026-09-01T14:55:00Z').toISOString());
    await addPopularityEvent(zone.id, new Date('2026-09-01T15:05:00Z').toISOString()); // outside the hour
    const result = await rollupHourly(zone.id, hour.toISOString());
    assert.equal(result.eventCount, 2);
  });

  test('naiveForecast uses the same hour 7 days prior when history exists', async () => {
    const zone = await createTestZone();
    const lastWeek = new Date('2026-08-25T14:00:00Z');
    await addPopularityEvent(zone.id, new Date('2026-08-25T14:10:00Z').toISOString());
    await addPopularityEvent(zone.id, new Date('2026-08-25T14:40:00Z').toISOString());
    await rollupHourly(zone.id, lastWeek.toISOString());

    const forecast = await naiveForecast(zone.id, '2026-09-01T14:00:00Z');
    assert.equal(forecast.predictedCount, 2);
    assert.equal(forecast.basis, 'same_hour_last_week');
  });

  test('naiveForecast falls back to a recent average when no matching history exists', async () => {
    const zone = await createTestZone();
    const forecast = await naiveForecast(zone.id, '2026-09-01T14:00:00Z');
    assert.equal(forecast.basis, 'recent_average_fallback');
    assert.equal(forecast.predictedCount, 0);
  });
});

describe('Popularity Analytics — recommendation approval gate (ADR007/ADR021)', () => {
  let app;
  before(async () => { app = await bootApp(); });
  after(async () => { await app.close(); });

  test('a recommendation cannot be approved without a note', async () => {
    const zone = await createTestZone();
    const model = await createTestModel({ governingAdr: 'ADR021' });
    const rec = await seedRecommendation(zone.id, model.id);
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, { token, body: {} });
    assert.equal(res.status, 400);
  });

  test('a BLOCKED recommendation cannot be approved even with a note', async () => {
    const zone = await createTestZone();
    const model = await createTestModel({ governingAdr: 'ADR021' });
    const rec = await seedRecommendation(zone.id, model.id, { status: 'blocked', blockedReason: 'stale zone data' });
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, {
      token, body: { note: 'approve anyway' },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'blocked');
  });

  test('a visitor (not staff) cannot approve recommendations', async () => {
    const zone = await createTestZone();
    const model = await createTestModel({ governingAdr: 'ADR021' });
    const rec = await seedRecommendation(zone.id, model.id);
    const { token } = await createVisitor();
    const res = await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, {
      token, body: { note: 'trying' },
    });
    assert.equal(res.status, 403);
  });

  test('operations staff CAN approve with a note — attributed and audited', async () => {
    const zone = await createTestZone();
    const model = await createTestModel({ governingAdr: 'ADR021' });
    const rec = await seedRecommendation(zone.id, model.id);
    const { user, token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, {
      token, body: { note: 'staffing makes sense given forecast' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'approved');
    assert.equal(res.body.approved_by, user.id);
  });

  test('an already-approved recommendation cannot be approved again', async () => {
    const zone = await createTestZone();
    const model = await createTestModel({ governingAdr: 'ADR021' });
    const rec = await seedRecommendation(zone.id, model.id);
    const { token } = await createStaffUser('operations');
    await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, { token, body: { note: 'ok' } });
    const second = await api(app.baseUrl, 'POST', `/api/popularity/recommendations/${rec.id}/approve`, { token, body: { note: 'again' } });
    assert.equal(second.status, 409);
  });
});
