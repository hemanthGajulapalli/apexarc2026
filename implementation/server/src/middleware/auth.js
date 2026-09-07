import { query } from '../db.js';

// -----------------------------------------------------------------------------
// LOCAL DEV STAND-IN for ADR016's OAuth 2.0/OIDC identity service.
//
// In production, visitor and staff identity both come from the cloud
// platform's managed identity service (ADR013/ADR016) — a real OAuth/OIDC
// provider issuing signed, verifiable tokens. This module exists so the rest
// of the codebase (route handlers, RBAC checks, audit trails) can be built
// and tested against the *real* identity/authorization SHAPE without standing
// up an actual OAuth provider locally. The token here is a base64 JSON blob,
// NOT cryptographically signed — swapping this file for real OIDC token
// verification is the entire migration path to production; no route handler
// needs to change, because they only ever read `req.user`.
// -----------------------------------------------------------------------------

export function issueToken(user) {
  return Buffer.from(JSON.stringify({ id: user.id, kind: user.kind })).toString('base64url');
}

function decodeToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// Attaches req.user (with .staffRoles: string[]) when a valid bearer token is
// present. Does NOT reject unauthenticated requests — routes that require
// auth use requireAuth()/requireRole() explicitly, so public endpoints (e.g.
// concierge queries for a not-yet-signed-in visitor) still work.
export async function attachUser(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  const decoded = decodeToken(token);
  if (!decoded?.id) return next();

  const { rows } = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
  if (rows.length === 0) return next();

  const user = rows[0];
  if (user.kind === 'staff') {
    const roleRows = await query('SELECT role FROM staff_assignments WHERE user_id = $1', [user.id]);
    user.staffRoles = roleRows.rows.map((r) => r.role);
  } else {
    user.staffRoles = [];
  }
  req.user = user;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated', message: 'Sign in required.' });
  next();
}

// ADR016: RBAC — Keeper, Operations, Admin. Kept deliberately coarse per the
// ADR's own advice ("keep the role list minimal at launch").
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated', message: 'Sign in required.' });
    const has = (req.user.staffRoles || []).some((r) => allowedRoles.includes(r));
    if (!has) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Requires one of: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}
