const API_BASE = 'https://techfest-feeproject.onrender.com/api';

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

async function dbGetAll() {
  const res = await fetch(`${API_BASE}/registrations`);
  if (!res.ok) throw new Error('Failed to fetch registrations');
  return await res.json();
}

async function dbDelete(id) {
  const res = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete registration');
  return await res.json();
}

async function dbClearAll() {
  const res = await fetch(`${API_BASE}/registrations`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear registrations');
  return await res.json();
}
