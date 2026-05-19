const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'techfest-data.json');

app.use(cors());
app.use(bodyParser.json());
// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '')));

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

console.log('Using JSON data store.');

// Helper: Generate Registration ID
function genRegId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'TF27-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── REGISTRATION API ──────────────────────────────────────

// Register a user
app.post('/api/register', (req, res) => {
  const { name, email, phone, event } = req.body;
  if (!name || !email || !event) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const store = readStore();
  const exists = store.registrations.some(row => row.email === email && row.event === event);
  if (exists) {
    return res.status(409).json({ duplicate: true, message: `${email} is already registered for ${event}.` });
  }

  const regId = genRegId();
  const timestamp = new Date().toISOString();
  const id = store.registrations.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
  const record = { id, regId, name, email, phone, event, timestamp };

  store.registrations.push(record);
  writeStore(store);
  res.json(record);
});

// Get all registrations
app.get('/api/registrations', (req, res) => {
  const store = readStore();
  res.json([...store.registrations].sort((a, b) => b.id - a.id));
});

// Delete registration
app.delete('/api/registrations/:id', (req, res) => {
  const id = Number(req.params.id);
  const store = readStore();
  const before = store.registrations.length;
  store.registrations = store.registrations.filter(row => row.id !== id);
  writeStore(store);
  res.json({ success: true, changes: before - store.registrations.length });
});

// Delete all registrations
app.delete('/api/registrations', (req, res) => {
  const store = readStore();
  const changes = store.registrations.length;
  store.registrations = [];
  writeStore(store);
  res.json({ success: true, changes });
});


// ─── AUTHENTICATION API (OTP) ──────────────────────────────

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  // In a real app, integrate Twilio here
  console.log(`\n===========================================`);
  console.log(`[MOCK SMS] Sending OTP to ${phone}: ${otp}`);
  console.log(`===========================================\n`);

  const store = readStore();
  store.otps[phone] = { otp, expiresAt };
  writeStore(store);
  res.json({ success: true, message: 'OTP sent successfully (check backend console)', otp: otp });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const store = readStore();
  const row = store.otps[phone];
  if (!row) return res.status(404).json({ error: 'OTP not requested or expired' });
  
  if (Date.now() > row.expiresAt) {
    delete store.otps[phone];
    writeStore(store);
    return res.status(400).json({ error: 'OTP has expired' });
  }
  
  if (row.otp === otp) {
    delete store.otps[phone];
    writeStore(store);
    const token = 'mock-jwt-token-' + Date.now();
    res.json({ success: true, token, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid OTP' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
