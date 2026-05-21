const REMOTE_API_BASE = 'https://techfest-feeproject.onrender.com/api';
// Stores only THIS device's own recent registrations for re-sync purposes
const MY_REGS_KEY = 'techfest_my_registrations';

function resolveApiBase() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (window.TECHFEST_API_BASE) return window.TECHFEST_API_BASE.replace(/\/$/, '');
  if (protocol === 'file:') return 'http://localhost:3000/api';
  if (localHosts.has(host)) return window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';
  if (host.endsWith('onrender.com')) return '/api';
  return REMOTE_API_BASE;
}

const API_BASE = resolveApiBase();
function apiUrl(path) { return `${API_BASE}${path}`; }
window.TechFestAPI = { base: API_BASE, url: apiUrl };

// ── Personal re-sync helpers (own registrations only) ────────────────
function getMyRegs() {
  try { return JSON.parse(localStorage.getItem(MY_REGS_KEY)) || []; } catch (_) { return []; }
}
function saveMyReg(record) {
  try {
    const mine = getMyRegs();
    if (!mine.find(r => r.regId === record.regId)) {
      mine.unshift(record);
      // Keep only last 10 personal registrations
      localStorage.setItem(MY_REGS_KEY, JSON.stringify(mine.slice(0, 10)));
    }
  } catch (_) {}
}

// On page load: try to re-sync any of MY OWN registrations that the server lost
async function syncMyRegistrationsToServer() {
  const mine = getMyRegs();
  if (!mine.length) return;
  try {
    const res = await fetch(apiUrl('/registrations'));
    if (!res.ok) return;
    const serverRegs = await res.json();
    const serverIds = new Set(serverRegs.map(r => r.regId));
    const missing = mine.filter(r => r.regId && !serverIds.has(r.regId));
    for (const reg of missing) {
      try {
        await fetch(apiUrl('/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: reg.name, email: reg.email, phone: reg.phone || '', event: reg.event })
        });
      } catch (_) {}
    }
  } catch (_) {}
}
// Run silently on page load
try { syncMyRegistrationsToServer(); } catch (_) {}

// ── API functions ─────────────────────────────────────────────────────
async function dbAddRegistration(data) {
  const res = await fetch(apiUrl('/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 409) throw { duplicate: true, message: json.message };
    throw new Error(json.error || 'Failed to register');
  }
  // Save MY own registration locally for re-sync safety
  saveMyReg(json);
  return json;
}

// dbGetAll ALWAYS fetches from server — never falls back to localStorage
// because other devices' registrations would be missing from local cache
async function dbGetAll() {
  const res = await fetch(apiUrl('/registrations'));
  if (!res.ok) throw new Error(`Failed to fetch registrations (${res.status})`);
  return await res.json();
}

async function dbDelete(id) {
  const res = await fetch(apiUrl(`/registrations/${id}`), { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete registration');
  return await res.json();
}

async function dbClearAll() {
  const res = await fetch(apiUrl('/registrations'), { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear registrations');
  return await res.json();
}
