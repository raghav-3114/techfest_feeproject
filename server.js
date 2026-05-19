const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '')));

// Database setup
const db = new sqlite3.Database('./techfest.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Registrations Table
    db.run(`CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regId TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      event TEXT,
      timestamp TEXT
    )`);
    
    // Create OTP Table
    db.run(`CREATE TABLE IF NOT EXISTS otps (
      phone TEXT PRIMARY KEY,
      otp TEXT,
      expiresAt INTEGER
    )`);
  }
});

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

  // Check duplicate
  db.get('SELECT * FROM registrations WHERE email = ? AND event = ?', [email, event], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ duplicate: true, message: `${email} is already registered for ${event}.` });

    const regId = genRegId();
    const timestamp = new Date().toISOString();
    
    const stmt = db.prepare('INSERT INTO registrations (regId, name, email, phone, event, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(regId, name, email, phone, event, timestamp, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, regId, name, email, phone, event, timestamp });
    });
    stmt.finalize();
  });
});

// Get all registrations
app.get('/api/registrations', (req, res) => {
  db.all('SELECT * FROM registrations ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete registration
app.delete('/api/registrations/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM registrations WHERE id = ?', id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// Delete all registrations
app.delete('/api/registrations', (req, res) => {
  db.run('DELETE FROM registrations', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});


// ─── AUTHENTICATION API (OTP) ──────────────────────────────

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  // In a real app, integrate Twilio here
  console.log(`\n===========================================`);
  console.log(`[MOCK SMS] Sending OTP to ${phone}: ${otp}`);
  console.log(`===========================================\n`);

  db.run('INSERT OR REPLACE INTO otps (phone, otp, expiresAt) VALUES (?, ?, ?)', [phone, otp, expiresAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'OTP sent successfully (check backend console)', otp: otp });
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  db.get('SELECT * FROM otps WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'OTP not requested or expired' });
    
    if (Date.now() > row.expiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    if (row.otp === otp) {
      // OTP verified successfully, clear the OTP
      db.run('DELETE FROM otps WHERE phone = ?', [phone]);
      
      // Return a mocked token
      const token = 'mock-jwt-token-' + Date.now();
      res.json({ success: true, token, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid OTP' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
