const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'techfest-data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { registrations: [], otps: {} };
    }

    const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      registrations: Array.isArray(store.registrations) ? store.registrations : [],
      otps: store.otps && typeof store.otps === 'object' ? store.otps : {}
    };
  } catch (err) {
    console.error('Error reading data store:', err.message);
    return { registrations: [], otps: {} };
  }
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function genRegId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'TF27-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

app.post('/api/register', (req, res) => {
  const { name, email, phone, event } = req.body;
  if (!name || !email || !event) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const store = readStore();
  const duplicate = store.registrations.some(row => row.email === email && row.event === event);
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
