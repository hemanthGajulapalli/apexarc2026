import { createApp } from '../src/app.js';
import { query } from '../src/db.js';
import { issueToken } from '../src/middleware/auth.js';

// Boots the real app in-process on an OS-assigned ephemeral port. No
// separate server process, no shell backgrounding — the test runner talks
// to the app directly over loopback HTTP, same as any real client would.
export async function bootApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  return {
    baseUrl: `http://localhost:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export async function api(baseUrl, method, path, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, body: json };
}

let counter = 0;
function unique(prefix) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

// Creates a fresh staff user with the given role and returns a bearer token
// — each test gets its own isolated actor rather than reusing seed users,
// so tests never collide on shared state.
export async function createStaffUser(role) {
  const email = `${unique('staff')}@test.local`;
  const inserted = await query(
    `INSERT INTO users (kind, email, display_name, oauth_provider, oauth_subject)
     VALUES ('staff', $1, $2, 'estate', $1) RETURNING *`,
    [email, `Test ${role}`]
  );
  const user = inserted.rows[0];
  await query(`INSERT INTO staff_assignments (user_id, role) VALUES ($1, $2)`, [user.id, role]);
  user.staffRoles = [role];
  return { user, token: issueToken(user) };
}

export async function createVisitor() {
  const email = `${unique('visitor')}@test.local`;
  const inserted = await query(
    `INSERT INTO users (kind, email, display_name, oauth_provider, oauth_subject)
     VALUES ('visitor', $1, $2, 'google', $1) RETURNING *`,
    [email, 'Test Visitor']
  );
  const user = inserted.rows[0];
  await query(`INSERT INTO loyalty_accounts (visitor_id) VALUES ($1)`, [user.id]);
  return { user, token: issueToken(user) };
}

export async function createTestZone(overrides = {}) {
  const { rows } = await query(
    `INSERT INTO zones (name, zone_type, ble_equipped, gateway_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      overrides.name || unique('Zone'),
      overrides.zoneType || 'enclosure',
      overrides.bleEquipped ?? false,
      overrides.gatewayId || 'gw-test',
    ]
  );
  return rows[0];
}

export async function createTestAlert(zoneId, overrides = {}) {
  const { rows } = await query(
    `INSERT INTO alerts (zone_id, alert_type, severity, origin, confidence, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      zoneId,
      overrides.alertType || 'eating_anomaly',
      overrides.severity || 'critical',
      overrides.origin || 'cloud_model',
      overrides.confidence ?? 0.9,
      overrides.status || 'notified',
    ]
  );
  return rows[0];
}

export async function createTestModel(overrides = {}) {
  const { rows } = await query(
    `INSERT INTO models (name, version, governing_adr, status, golden_set_score, golden_set_threshold, drift_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      overrides.name || unique('TestModel'),
      overrides.version || 'v1.0',
      overrides.governingAdr || 'ADR011',
      overrides.status || 'candidate',
      overrides.goldenSetScore ?? null,
      overrides.goldenSetThreshold ?? 0.85,
      overrides.driftStatus || 'nominal',
    ]
  );
  return rows[0];
}

export async function createGoldenSetRun(modelId, overallScore, passed) {
  const { rows } = await query(
    `INSERT INTO golden_set_runs (model_id, overall_score, passed) VALUES ($1, $2, $3) RETURNING *`,
    [modelId, overallScore, passed]
  );
  return rows[0];
}
