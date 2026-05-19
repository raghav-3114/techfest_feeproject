// ═══════════════════════════════════════════════════════
//  TechFest 2026 — API Database Layer
// ═══════════════════════════════════════════════════════

const API_BASE = 'https://techfest-feeproject.onrender.com/api';

/** Add a registration */
async function dbAddRegistration(data) {
  const res = await fetch(`${API_BASE}/register`, {
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

/** Get all registrations, newest first */
async function dbGetAll() {
  const res = await fetch(`${API_BASE}/registrations`);
  if (!res.ok) throw new Error('Failed to fetch registrations');
  return await res.json();
}

/** Delete a single registration by id */
async function dbDelete(id) {
  const res = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete registration');
  return await res.json();
}

/** Delete ALL registrations */
async function dbClearAll() {
  const res = await fetch(`${API_BASE}/registrations`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear registrations');
  return await res.json();
}

/** Count registrations per event (Not strictly needed since admin calculates it, but kept for compatibility) */
async function dbGetStats() {
  const all = await dbGetAll();
  return {
    total:    all.length,
    hackathon: all.filter(r => r.event === 'Hackathon').length,
    robowars:  all.filter(r => r.event === 'Robo-Wars').length,
    vr:        all.filter(r => r.event === 'Immersive VR').length,
  };
}

/** Check if email+event already registered */
async function dbCheckDuplicate(email, event) {
  const all = await dbGetAll();
  return all.some(r => r.email === email && r.event === event);
}
