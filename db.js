const REMOTE_API_BASE = 'https://techfest-feeproject.onrender.com/api';

function resolveApiBase() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  if (window.TECHFEST_API_BASE) {
    return window.TECHFEST_API_BASE.replace(/\/$/, '');
  }

  if (protocol === 'file:') {
    return 'http://localhost:3000/api';
  }

  if (localHosts.has(host)) {
    return window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';
  }

  if (host.endsWith('onrender.com')) {
    return '/api';
  }

  return REMOTE_API_BASE;
}

const API_BASE = resolveApiBase();

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

window.TechFestAPI = {
  base: API_BASE,
  url: apiUrl
};

async function dbAddRegistration(data) {
  const res = await fetch(apiUrl('/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();

  if (!res.ok) {
    if (res.status === 409) {
      throw { duplicate: true, message: json.message };
    }
    throw new Error(json.error || 'Failed to register');
  }

  return json;
}

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
