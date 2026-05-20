const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || process.env.RENDER_DISK_PATH || __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, 'techfest-data.json');
const VALID_EVENTS = new Set(['Hackathon', 'Robo-Wars', 'Immersive VR']);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function emptyStore() {
  return { registrations: [], otps: {} };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeRegistration(row, index = 0) {
  return {
    id: Number(row.id) || index + 1,
    regId: row.regId || genRegId(),
    name: normalizeText(row.name),
    email: normalizeEmail(row.email),
    phone: normalizePhone(row.phone),
    event: normalizeText(row.event),
    timestamp: row.timestamp || new Date().toISOString()
  };
}

function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return emptyStore();
    }

    const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      registrations: Array.isArray(store.registrations)
        ? store.registrations.map(normalizeRegistration)
        : [],
      otps: store.otps && typeof store.otps === 'object' ? store.otps : {}
    };
  } catch (err) {
    console.error('Error reading data store:', err.message);
    return emptyStore();
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const payload = JSON.stringify({
    registrations: store.registrations.map(normalizeRegistration),
    otps: store.otps || {}
  }, null, 2);
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, payload);
  fs.renameSync(tempFile, DATA_FILE);
}

function genRegId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'TF26-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

app.post('/api/register', (req, res) => {
  const name = normalizeText(req.body.name);
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const event = normalizeText(req.body.event);

  if (!name || !email || !event) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!VALID_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Invalid event selected' });
  }

  const store = readStore();
  const duplicate = store.registrations.find(row =>
    normalizeEmail(row.email) === email && normalizeText(row.event) === event
  );
  if (duplicate) {
    return res.status(409).json({ duplicate: true, message: `${email} is already registered for ${event}.` });
  }

  const record = {
    id: store.registrations.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1,
    regId: genRegId(),
    name,
    email,
    phone,
    event,
    timestamp: new Date().toISOString()
  };

  store.registrations.push(record);
  writeStore(store);
  res.json(record);
});

app.get('/api/registrations', (req, res) => {
  const store = readStore();
  res.json([...store.registrations].sort((a, b) => b.id - a.id));
});

app.delete('/api/registrations/:id', (req, res) => {
  const id = Number(req.params.id);
  const store = readStore();
  const before = store.registrations.length;

  store.registrations = store.registrations.filter(row => row.id !== id);
  writeStore(store);
  res.json({ success: true, changes: before - store.registrations.length });
});

app.delete('/api/registrations', (req, res) => {
  const store = readStore();
  const changes = store.registrations.length;

  store.registrations = [];
  writeStore(store);
  res.json({ success: true, changes });
});

app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const store = readStore();

  store.otps[phone] = { otp, expiresAt };
  writeStore(store);

  console.log(`[MOCK SMS] Sending OTP to ${phone}: ${otp}`);
  res.json({ success: true, message: 'OTP sent successfully', otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const store = readStore();
  const record = store.otps[phone];
  if (!record) {
    return res.status(404).json({ error: 'OTP not requested or expired' });
  }

  if (Date.now() > record.expiresAt) {
    delete store.otps[phone];
    writeStore(store);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  delete store.otps[phone];
  writeStore(store);
  res.json({ success: true, token: `mock-jwt-token-${Date.now()}`, message: 'Login successful' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
