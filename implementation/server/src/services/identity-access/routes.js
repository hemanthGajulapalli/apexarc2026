import { Router } from 'express';
import { query } from '../../db.js';
import { issueToken, requireAuth, requireRole } from '../../middleware/auth.js';

// Identity & Access service (ADR016). Real REST surface for the OAuth
// sign-in flow (screen-signin in visitor-hub-wireframe.html) and staff RBAC
// management (screen-accounts in ai-governance-console-wireframe.html).
export const identityAccessRouter = Router();

// POST /api/auth/signin  { provider: "google"|"apple"|"estate", email, displayName, kind }
// Mock OAuth callback: in production this is the redirect target after a
// real OAuth 2.0/OIDC provider round-trip (ADR016). Here it upserts a user
// directly from the claims a real provider would have supplied.
identityAccessRouter.post('/auth/signin', async (req, res) => {
  const { provider, email, displayName, kind } = req.body || {};
  if (!provider || !email || !displayName || !kind) {
    return res.status(400).json({ error: 'invalid_request', message: 'provider, email, displayName, kind are required.' });
  }
  if (!['google', 'apple', 'estate'].includes(provider)) {
    return res.status(400).json({ error: 'invalid_request', message: 'Unsupported provider.' });
  }
  if (!['visitor', 'staff'].includes(kind)) {
    return res.status(400).json({ error: 'invalid_request', message: 'kind must be visitor or staff.' });
  }

  const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
  let user;
  if (existing.rows.length > 0) {
    user = existing.rows[0];
  } else {
    const inserted = await query(
      `INSERT INTO users (kind, email, display_name, oauth_provider, oauth_subject)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [kind, email, displayName, provider, `${provider}-${email}`]
    );
    user = inserted.rows[0];
    if (kind === 'visitor') {
      await query(
        `INSERT INTO loyalty_accounts (visitor_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }
  }

  const token = issueToken(user);
  res.json({ token, user: { id: user.id, kind: user.kind, email: user.email, displayName: user.display_name } });
});

// GET /api/auth/me
identityAccessRouter.get('/auth/me', requireAuth, async (req, res) => {
  res.json({
    id: req.user.id,
    kind: req.user.kind,
    email: req.user.email,
    displayName: req.user.display_name,
    staffRoles: req.user.staffRoles || [],
  });
});

// GET /api/staff — Admin only (screen-accounts)
identityAccessRouter.get('/staff', requireRole('admin'), async (_req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.display_name, sa.role, sa.scope_note, sa.assigned_at
     FROM staff_assignments sa JOIN users u ON u.id = sa.user_id
     ORDER BY sa.assigned_at`
  );
  res.json(rows);
});

// POST /api/staff — invite/assign a staff role. Admin only.
identityAccessRouter.post('/staff', requireRole('admin'), async (req, res) => {
  const { email, displayName, role, scopeNote } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: 'invalid_request', message: 'email and role are required.' });
  }
  if (!['keeper', 'operations', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'invalid_request', message: 'role must be keeper, operations, or admin.' });
  }

  let user = (await query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
  if (!user) {
    const inserted = await query(
      `INSERT INTO users (kind, email, display_name, oauth_provider, oauth_subject)
       VALUES ('staff', $1, $2, 'estate', $3) RETURNING *`,
      [email, displayName || email, `estate-${email}`]
    );
    user = inserted.rows[0];
  }

  const assigned = await query(
    `INSERT INTO staff_assignments (user_id, role, scope_note) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, role) DO UPDATE SET scope_note = EXCLUDED.scope_note
     RETURNING *`,
    [user.id, role, scopeNote || null]
  );

  res.status(201).json({ user: { id: user.id, email: user.email, displayName: user.display_name }, assignment: assigned.rows[0] });
});
