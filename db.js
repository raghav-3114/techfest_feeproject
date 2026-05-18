// ═══════════════════════════════════════════════════════
//  TechFest 2026 — IndexedDB Database Layer
// ═══════════════════════════════════════════════════════

const DB_NAME    = 'techfest_db';
const DB_VERSION = 1;
const STORE_NAME = 'registrations';

let _db = null;

/** Open (or create) the IndexedDB database */
function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return; }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db    = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('email',       'email',       { unique: false });
        store.createIndex('event',       'event',       { unique: false });
        store.createIndex('email_event', ['email','event'], { unique: true }); // ← duplicate guard
        store.createIndex('timestamp',   'timestamp',   { unique: false });
      }
    };

    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = (e) => reject(e.target.error);
  });
}

/** Generate a human-readable registration ID */
function genRegId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'TF27-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** Add a registration — rejects with { duplicate: true } if already registered */
async function dbAddRegistration(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      ...data,
      regId:     genRegId(),
      timestamp: new Date().toISOString()
    };

    const req = store.add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror   = (e) => {
      if (e.target.error && e.target.error.name === 'ConstraintError') {
        reject({ duplicate: true, message: `${data.email} is already registered for ${data.event}.` });
      } else {
        reject(e.target.error);
      }
    };
  });
}

/** Get all registrations, newest first */
async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result.reverse());
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Delete a single registration by id */
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Delete ALL registrations */
async function dbClearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Count registrations per event */
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const idx   = store.index('email_event');
    const req   = idx.get([email, event]);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}
