import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, api, createStaffUser, createVisitor } from './testHelpers.js';

describe('Identity & Access (ADR016)', () => {
  let app;
  before(async () => { app = await bootApp(); });
  after(async () => { await app.close(); });

  test('sign-in with an unsupported provider is rejected', async () => {
    const res = await api(app.baseUrl, 'POST', '/api/auth/signin', {
      body: { provider: 'facebook', email: 'x@example.com', displayName: 'X', kind: 'visitor' },
    });
    assert.equal(res.status, 400);
  });

  test('sign-in twice with the same email returns the same user (idempotent identity)', async () => {
    const email = `dup-${Date.now()}@example.com`;
    const first = await api(app.baseUrl, 'POST', '/api/auth/signin', {
      body: { provider: 'google', email, displayName: 'Dup Test', kind: 'visitor' },
    });
    const second = await api(app.baseUrl, 'POST', '/api/auth/signin', {
      body: { provider: 'google', email, displayName: 'Dup Test', kind: 'visitor' },
    });
    assert.equal(first.body.user.id, second.body.user.id);
  });

  test('GET /auth/me requires authentication', async () => {
    const res = await api(app.baseUrl, 'GET', '/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('GET /auth/me returns staff roles for a staff user', async () => {
    const { token } = await createStaffUser('keeper');
    const res = await api(app.baseUrl, 'GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.staffRoles, ['keeper']);
  });

  test('only Admin can list staff accounts — Operations is rejected', async () => {
    const { token } = await createStaffUser('operations');
    const res = await api(app.baseUrl, 'GET', '/api/staff', { token });
    assert.equal(res.status, 403);
  });

  test('Admin can invite a new staff member with a role', async () => {
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', '/api/staff', {
      token,
      body: { email: `newkeeper-${Date.now()}@test.local`, displayName: 'New Keeper', role: 'keeper' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.assignment.role, 'keeper');
  });

  test('inviting with an invalid role is rejected', async () => {
    const { token } = await createStaffUser('admin');
    const res = await api(app.baseUrl, 'POST', '/api/staff', {
      token,
      body: { email: `bad-${Date.now()}@test.local`, role: 'superuser' },
    });
    assert.equal(res.status, 400);
  });
});

describe('Ticketing, Loyalty & Personalization (ADR008/ADR009/ADR018/ADR022)', () => {
  let app;
  before(async () => { app = await bootApp(); });
  after(async () => { await app.close(); });

  test('a ticket purchase requires at least one adult or child', async () => {
    const { token } = await createVisitor();
    const res = await api(app.baseUrl, 'POST', '/api/ticketing/purchase', {
      token, body: { visitDate: '2026-09-12', adults: 0, children: 0 },
    });
    assert.equal(res.status, 400);
  });

  test('a family-pass purchase computes the correct total and promo discount', async () => {
    const { token } = await createVisitor();
    const res = await api(app.baseUrl, 'POST', '/api/ticketing/purchase', {
      token, body: { visitDate: '2026-09-12', adults: 2, children: 3, addOns: ['parking'], promoCode: 'RETURN10' },
    });
    assert.equal(res.status, 201);
    // (2*29 + 3*15 + 8) * 0.9 = (58+45+8)*0.9 = 111*0.9 = 99.90
    assert.equal(res.body.total_price, '99.90');
  });

  test('personalization is off by default for a visitor who opted out — offers are refused, not silently empty', async () => {
    const { token } = await createVisitor();
    await api(app.baseUrl, 'PATCH', '/api/ticketing/loyalty/consent', { token, body: { optIn: false } });
    const res = await api(app.baseUrl, 'GET', '/api/personalization/offers', { token });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'personalization_opted_out');
  });

  test('the concierge only answers questions it can ground in real zone data', async () => {
    const res = await api(app.baseUrl, 'POST', '/api/concierge/ask', {
      body: { question: 'What is the meaning of life?' },
    });
    assert.equal(res.status, 200);
    assert.match(res.body.answer, /try asking about one directly/i);
    assert.ok(res.body.confidence < 0.5, 'ungrounded answers should carry low confidence');
  });
});
