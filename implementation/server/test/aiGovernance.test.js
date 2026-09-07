import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, api, createStaffUser, createTestModel, createGoldenSetRun } from './testHelpers.js';

describe('AI Governance — ADR020 hard deploy gate', () => {
  let app;
  before(async () => { app = await bootApp(); });
  after(async () => { await app.close(); });

  test('a model with no golden-set run on record cannot be promoted', async () => {
    const model = await createTestModel();
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/promote`, {
      token, body: { note: 'trying' },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'no_golden_set_run');
  });

  test('a FAILING golden-set result blocks promotion — this is the actual gate, not UI theater', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.72, false);
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/promote`, {
      token, body: { note: 'trying anyway' },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'golden_set_failed');
  });

  test('a non-admin (operations) cannot promote even a passing model — RBAC', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.95, true);
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/promote`, {
      token, body: { note: 'not my call' },
    });
    assert.equal(res.status, 403);
  });

  test('a PASSING golden-set result allows promotion, attributed to the approver', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.95, true);
    const { user, token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/promote`, {
      token, body: { note: 'reviewed, looks good' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.result, 'pass');
    assert.equal(res.body.promoted_by, user.id);

    const detail = await api(app.baseUrl, 'GET', `/api/ai-governance/models/${model.id}`, { token });
    assert.equal(detail.body.model.status, 'production');
  });

  test('overriding a blocked model requires a non-empty justification', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.72, false);
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/override`, {
      token, body: {},
    });
    assert.equal(res.status, 400);
  });

  test('overriding a blocked model with justification promotes it AND records the override, attributed', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.72, false);
    const { user, token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/override`, {
      token, body: { justification: 'known seasonal variance, accepted by keeper review' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.approver_id, user.id);
    assert.equal(res.body.golden_set_score_at_override, '0.720');

    const detail = await api(app.baseUrl, 'GET', `/api/ai-governance/models/${model.id}`, { token });
    assert.equal(detail.body.model.status, 'production');
    assert.equal(detail.body.overrides.length, 1);
    // and the override is on record in the deploy log too — a 'fail' entry, not disguised as a clean pass
    assert.equal(detail.body.deployLog[0].result, 'fail');
  });

  test('cannot override a model that is already passing — must use /promote', async () => {
    const model = await createTestModel();
    await createGoldenSetRun(model.id, 0.95, true);
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', `/api/ai-governance/models/${model.id}/override`, {
      token, body: { justification: 'unnecessary' },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'not_blocked');
  });

  test('promoting a new version retires the previous production version of the same model name', async () => {
    const { token } = await createStaffUser('admin');
    const modelName = `Retire-Test-${Date.now()}`;
    const v1 = await createTestModel({ name: modelName, version: 'v1.0', status: 'production' });
    const v2 = await createTestModel({ name: modelName, version: 'v2.0' });
    await createGoldenSetRun(v2.id, 0.95, true);

    await api(app.baseUrl, 'POST', `/api/ai-governance/models/${v2.id}/promote`, { token, body: { note: 'v2 rollout' } });

    const v1After = await api(app.baseUrl, 'GET', `/api/ai-governance/models/${v1.id}`, { token });
    const v2After = await api(app.baseUrl, 'GET', `/api/ai-governance/models/${v2.id}`, { token });
    assert.equal(v1After.body.model.status, 'retired');
    assert.equal(v2After.body.model.status, 'production');
  });

  test('the seeded Piranha-Count v3.2 candidate reflects the real per-category breakdown', async () => {
    const { token } = await createStaffUser('admin');
    const models = await api(app.baseUrl, 'GET', '/api/ai-governance/models', { token });
    const candidate = models.body.find((m) => m.name === 'Piranha-Count' && m.version === 'v3.2');
    assert.ok(candidate, 'seeded v3.2 candidate should exist');
    const detail = await api(app.baseUrl, 'GET', `/api/ai-governance/models/${candidate.id}`, { token });
    assert.equal(detail.body.latestRun.passed, false);
    assert.equal(detail.body.categories.length, 4);
    const turbid = detail.body.categories.find((c) => c.category === 'Turbid / low visibility');
    assert.equal(turbid.tests_passed, 21);
  });
});
