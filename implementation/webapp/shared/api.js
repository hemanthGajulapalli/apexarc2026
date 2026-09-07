// Shared API client + small UX helpers used by every real page in this
// webapp. Session token persists in localStorage (a real production build
// would use an httpOnly cookie from the actual OAuth provider — see
// implementation/server/src/middleware/auth.js for why this is a documented
// local stand-in, not the production mechanism).

const TOKEN_KEY = 'vde_token';
const USER_KEY = 'vde_user';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// --- Small, dependency-free UX helpers -------------------------------------

export function toast(message, { error = false } = {}) {
  let el = document.getElementById('vde-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vde-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.toggle('error', error);
  el.classList.add('show');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

export function skeletonRows(container, count = 3, height = 56) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'skeleton';
    div.style.height = `${height}px`;
    div.style.marginBottom = '10px';
    container.appendChild(div);
  }
}

export function emptyState(container, message) {
  container.innerHTML = `<div class="empty-state">${message}</div>`;
}

// Wraps a button's click handler so it disables + shows a busy label while
// the async action runs, and re-enables afterward — a small, real UX
// guarantee against double-submits on approval/confirm actions.
export function onClickBusy(button, busyLabel, handler) {
  const originalLabel = button.textContent;
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = busyLabel;
    try {
      await handler();
    } catch (err) {
      toast(err.message || 'Something went wrong.', { error: true });
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}

export function requireSession(redirectTo = '/index.html') {
  if (!getToken()) {
    window.location.href = redirectTo;
    return null;
  }
  return getUser();
}

export function requireRole(role, redirectTo = '/index.html') {
  const user = requireSession(redirectTo);
  if (!user) return null;
  if (!(user.staffRoles || []).includes(role)) {
    document.body.innerHTML = `<div class="empty-state">Requires the <b>${role}</b> role. Signed in as ${user.displayName || user.email}.</div>`;
    return null;
  }
  return user;
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Demo/screenshot convenience only: opening any page with ?demo=<email>
// signs in as that seeded account automatically (staff demo accounts, or
// any other address as a fresh visitor) before the page's normal
// requireSession()/requireRole() checks run. Never a bypass of auth itself
// — it still goes through the real /auth/signin endpoint; it just skips
// clicking the button by hand. Harmless to ship: does nothing unless the
// query param is present.
const DEMO_STAFF_ACCOUNTS = {
  'amara.osei@vondigitalis.example': 'Amara Osei',
  'jonas.meyer@vondigitalis.example': 'Jonas Meyer',
  'priya.nair@vondigitalis.example': 'Priya Nair',
};

export async function ensureDemoSession() {
  const email = new URLSearchParams(location.search).get('demo');
  if (!email || getToken()) return;
  const isStaff = email in DEMO_STAFF_ACCOUNTS;
  const { token, user } = await api('POST', '/auth/signin', {
    provider: isStaff ? 'estate' : 'google',
    email,
    displayName: isStaff ? DEMO_STAFF_ACCOUNTS[email] : 'Demo Visitor',
    kind: isStaff ? 'staff' : 'visitor',
  });
  setSession(token, user);
  if (isStaff) {
    const me = await api('GET', '/auth/me');
    setSession(token, { ...user, staffRoles: me.staffRoles });
  }
}
