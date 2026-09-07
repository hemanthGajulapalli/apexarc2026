import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, api, createStaffUser, createTestZone, createTestAlert, createTestModel } from './testHelpers.js';

describe('Animal Monitoring — ADR007 human-in-the-loop guardrail', () => {
  let app;
  before(async () => { app = await bootApp(); });
  after(async () => { await app.close(); });

  test('creating an edge-threshold alert is always critical/notified regardless of confidence (ADR002)', async () => {
    const zone = await createTestZone();
    const res = await api(app.baseUrl, 'POST', '/api/animal-health/alerts', {
      body: { zoneId: zone.id, alertType: 'no_motion_detected', origin: 'edge_threshold' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.severity, 'critical');
    assert.equal(res.body.status, 'notified');
  });

  test('a low-confidence cloud-model alert is tiered info/logged, not notified', async () => {
    const zone = await createTestZone();
    const res = await api(app.baseUrl, 'POST', '/api/animal-health/alerts', {
      body: { zoneId: zone.id, alertType: 'activity_dip', origin: 'cloud_model', confidence: 0.5 },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.severity, 'info');
    assert.equal(res.body.status, 'logged');
  });

  test('a keeper cannot dismiss an alert without a note', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { token } = await createStaffUser('keeper');
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/dismiss`, {
      token,
      body: {},
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /note is required/i);
  });

  test('an unauthenticated caller cannot dismiss an alert', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/dismiss`, {
      body: { note: 'looks fine' },
    });
    assert.equal(res.status, 401);
  });

  test('a non-keeper staff role (operations) cannot dismiss an alert — RBAC (ADR016)', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/dismiss`, {
      token,
      body: { note: 'not my call' },
    });
    assert.equal(res.status, 403);
  });

  test('a keeper CAN dismiss with a note — false-positive label recorded (the fixed UC02 gap)', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { user, token } = await createStaffUser('keeper');
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/dismiss`, {
      token,
      body: { note: 'checked manually, normal variance' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'dismissed');
    assert.equal(res.body.resolved_by, user.id);
    assert.equal(res.body.resolution_note, 'checked manually, normal variance');
  });

  test('a keeper CAN confirm with a note — true-positive label recorded', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { token } = await createStaffUser('keeper');
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/confirm`, {
      token,
      body: { note: 'confirmed via visual check' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'confirmed');
  });

  test('an alert cannot be labeled twice (idempotency / no re-litigating a decision)', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { token } = await createStaffUser('keeper');
    const first = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/confirm`, {
      token, body: { note: 'first pass' },
    });
    assert.equal(first.status, 200);
    const second = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/dismiss`, {
      token, body: { note: 'trying to relabel' },
    });
    assert.equal(second.status, 409);
  });

  test('a treatment cannot be proposed for an unconfirmed alert', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id); // still 'notified', not confirmed
    const { token } = await createStaffUser('keeper');
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/treatment`, {
      token, body: { plan: 'reduce feed 20%', note: 'jumping ahead' },
    });
    assert.equal(res.status, 409);
  });

  test('a treatment CAN be proposed once the alert is confirmed', async () => {
    const zone = await createTestZone();
    const alert = await createTestAlert(zone.id);
    const { token } = await createStaffUser('keeper');
    await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/confirm`, { token, body: { note: 'confirmed' } });
    const res = await api(app.baseUrl, 'POST', `/api/animal-health/alerts/${alert.id}/treatment`, {
      token, body: { plan: 'reduce feed 20% for 48h', note: 'approved per protocol' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.proposed_plan, 'reduce feed 20% for 48h');
  });

  test('feeding log requires keeper role', async () => {
    const zone = await createTestZone();
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', '/api/animal-health/feeding-logs', {
      token, body: { zoneId: zone.id, amountG: 120 },
    });
    assert.equal(res.status, 403);
  });

  test('population review requires a note and rejects a second review', async () => {
    const zone = await createTestZone({ bleEquipped: true });
    const { token } = await createStaffUser('keeper');
    const modelRow = await createTestModel({ governingAdr: 'ADR006' });
    const capture = await api(app.baseUrl, 'POST', `/api/animal-health/population/${zone.id}/capture`, {
      token, body: { visionCount: 34, confidence: 0.6, modelId: modelRow.id },
    });
    assert.equal(capture.status, 201);

    const noNote = await api(app.baseUrl, 'POST', `/api/animal-health/population/${capture.body.id}/review`, {
      token, body: { decision: 'dismissed' },
    });
    assert.equal(noNote.status, 400);

    const reviewed = await api(app.baseUrl, 'POST', `/api/animal-health/population/${capture.body.id}/review`, {
      token, body: { decision: 'confirmed_decline', note: 'consistent with lower feeding', manualCrossCheck: 33 },
    });
    assert.equal(reviewed.status, 200);
    assert.equal(reviewed.body.review_status, 'confirmed_decline');

    const again = await api(app.baseUrl, 'POST', `/api/animal-health/population/${capture.body.id}/review`, {
      token, body: { decision: 'dismissed', note: 'second try' },
    });
    assert.equal(again.status, 409);
  });
});
