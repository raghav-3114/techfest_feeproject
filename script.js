// ═══════════════════════════════════════════════════════
//  TechFest 2026 — Main Script
// ═══════════════════════════════════════════════════════

// ─── AUTHENTICATION CHECK ───────────────────────────────
(function checkAuth() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = page === 'login.html';
  const token = localStorage.getItem('auth_token');
  const pendingOtp = sessionStorage.getItem('pending_otp_challenge');
  
  if (!token && !isLoginPage) {
    sessionStorage.setItem('post_login_redirect', page);
    window.location.href = 'login.html';
  } else if (token && isLoginPage && !pendingOtp) {
    const redirectTo = sessionStorage.getItem('post_login_redirect') || 'index.html';
    sessionStorage.removeItem('post_login_redirect');
    window.location.href = redirectTo;
  }
})();

// ─── MOBILE HAMBURGER NAV ───────────────────────────────
(function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    hamburger.innerHTML = open
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  });

  navMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    })
  );
})();

// ─── ACTIVE NAV LINK ────────────────────────────────────
(function highlightNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
})();

// ─── CUSTOM CURSOR ──────────────────────────────────────
(function initCursor() {
  if (window.innerWidth <= 768) return;
  const dot  = document.createElement('div'); dot.className  = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    ring.style.left = e.clientX + 'px';
    ring.style.top  = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, .btn, .card, .form-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
})();

// ─── SCROLL REVEAL ──────────────────────────────────────
(function initReveal() {
  const targets = document.querySelectorAll('.card, .stat-card, .hero-content, .form, .reveal-el');
  targets.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach(el => obs.observe(el));
})();

// ─── 3D TILT ON CARDS ───────────────────────────────────
(function initTilt() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-10px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

// ─── COUNTDOWN TIMER ────────────────────────────────────
const eventDate = new Date('June 30, 2026 15:00:00').getTime();
let prevTimes   = { days: -1, hours: -1, minutes: -1, seconds: -1 };

setInterval(() => {
  const dEl = document.getElementById('days');
  if (!dEl) return;
  const dist = eventDate - Date.now();
  if (dist <= 0) {
    ['days','hours','minutes','seconds'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '00';
    });
    return;
  }
  updateFlip('days',    Math.floor(dist / 86400000));
  updateFlip('hours',   Math.floor((dist / 3600000) % 24));
  updateFlip('minutes', Math.floor((dist / 60000)   % 60));
  updateFlip('seconds', Math.floor((dist / 1000)    % 60));
}, 1000);

function updateFlip(id, value) {
  const formatted = String(value).padStart(2, '0');
  if (prevTimes[id] === formatted) return;
  prevTimes[id] = formatted;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('flipping');
  void el.offsetWidth;
  el.classList.add('flipping');
  setTimeout(() => { el.innerText = formatted; }, 275);
}

// ─── TOAST NOTIFICATION ─────────────────────────────────
function showToast(title, msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const icons = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const colors = { success: 'var(--cyan)', warning: 'var(--orange)', error: 'var(--magenta)', info: '#a78bfa' };
  const icon  = icons[type]  || icons.success;
  const color = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fas ${icon} toast-icon" style="color:${color}"></i>
    <div class="toast-body">
      <strong style="color:${color}">${title}</strong>
      <span>${msg}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
}

// ─── REGISTER FORM ──────────────────────────────────────
async function submitForm(e) {
  e.preventDefault();
  const btn   = e.target.querySelector('.form-btn');
  const name  = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const event = document.getElementById('event').value;

  if (!name || !email || !event) {
    showToast('Missing Fields', 'Please fill in all required fields.', 'warning'); return;
  }

  // Button loading state
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> &nbsp;Processing…';

  try {
    const record = await dbAddRegistration({ name, email, phone, event });
    e.target.reset();
    showConfirmation(record);
  } catch (err) {
    if (err && err.duplicate) {
      showToast('Already Registered', err.message, 'warning');
    } else {
      showToast('Error', 'Something went wrong. Please try again.', 'error');
      console.error(err);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-satellite-dish"></i> &nbsp;Transmit Data';
  }
}

function showConfirmation(record) {
  const modal = document.getElementById('confirm-modal');
  if (!modal) { showToast('Registered!', `Welcome, ${record.name}! ID: ${record.regId}`, 'success'); return; }
  document.getElementById('conf-name').textContent  = record.name;
  document.getElementById('conf-event').textContent = record.event;
  document.getElementById('conf-id').textContent    = record.regId;
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('open');
}

// ─── ADMIN PANEL ─────────────────────────────────────────
let _allUsers = [];

async function initAdmin() {
  const table = document.getElementById('data');
  if (!table) return;

  try {
    _allUsers = await dbGetAll();
  } catch(e) {
    // fallback: try migrating old localStorage data
    let old = [];
    try { old = JSON.parse(localStorage.getItem('users')) || []; } catch(_) {}
    if (old.length) {
      for (const u of old) {
        try { await dbAddRegistration(u); } catch(_) {}
      }
      localStorage.removeItem('users');
      _allUsers = await dbGetAll();
    }
  }

  renderStats(_allUsers);
  renderTable(_allUsers);

  // Search
  const searchEl = document.getElementById('admin-search');
  if (searchEl) searchEl.addEventListener('input', () => applyFilter());

  // Filter
  const filterEl = document.getElementById('admin-filter');
  if (filterEl) filterEl.addEventListener('change', () => applyFilter());
}

function applyFilter() {
  const query    = (document.getElementById('admin-search')?.value || '').toLowerCase();
  const eventFil = document.getElementById('admin-filter')?.value || 'all';
  let filtered   = _allUsers;
  if (eventFil !== 'all') filtered = filtered.filter(u => u.event === eventFil);
  if (query)              filtered = filtered.filter(u =>
    u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
  );
  renderTable(filtered);
}

function renderStats(users) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total', users.length);
  set('stat-hack',  users.filter(u => u.event === 'Hackathon').length);
  set('stat-robo',  users.filter(u => u.event === 'Robo-Wars').length);
  set('stat-vr',    users.filter(u => u.event === 'Immersive VR').length);
}

function renderTable(users) {
  const table = document.getElementById('data');
  if (!table) return;

  if (!users.length) {
    table.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <i class="fas fa-satellite-dish"></i>
        No registrations found.
      </div></td></tr>`;
    return;
  }

  const eventClass = { 'Hackathon': 'badge-orange', 'Robo-Wars': 'badge-cyan', 'Immersive VR': 'badge-magenta' };
  const eventIcon  = { 'Hackathon': 'fa-code', 'Robo-Wars': 'fa-robot', 'Immersive VR': 'fa-vr-cardboard' };

  table.innerHTML = users.map((u, i) => {
    const cls  = eventClass[u.event] || 'badge-orange';
    const icon = eventIcon[u.event]  || 'fa-star';
    const date = u.timestamp ? new Date(u.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
    const initials = u.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    return `
      <tr style="animation:fadeUp 0.35s ${i * 0.04}s both">
        <td>
          <div class="user-cell">
            <div class="avatar">${initials}</div>
            <div><div class="user-name">${escHtml(u.name)}</div>
            <div class="reg-id">${u.regId || '—'}</div></div>
          </div>
        </td>
        <td class="mono muted">${escHtml(u.email)}</td>
        <td class="mono muted">${escHtml(u.phone || '—')}</td>
        <td><span class="badge ${cls}"><i class="fas ${icon}"></i>${escHtml(u.event)}</span></td>
        <td class="mono muted small">${date}</td>
        <td>
          <button class="del-btn" onclick="deleteUser(${u.id}, this)" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

async function deleteUser(id, btn) {
  if (!confirm('Remove this registration permanently?')) return;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    await dbDelete(id);
    _allUsers = _allUsers.filter(u => u.id !== id);
    renderStats(_allUsers);
    applyFilter();
    showToast('Deleted', 'Registration removed.', 'info');
  } catch(e) {
    showToast('Error', 'Could not delete. Please try again.', 'error');
  }
}

async function clearAll() {
  if (!confirm('Purge ALL registration records? This cannot be undone.')) return;
  await dbClearAll();
  _allUsers = [];
  renderStats([]);
  renderTable([]);
  showToast('Purged', 'All records deleted.', 'warning');
}

function exportCSV() {
  if (!_allUsers.length) { showToast('No Data', 'Nothing to export yet.', 'info'); return; }
  const header = ['Reg ID','Name','Email','Phone','Event','Registered On'];
  const rows   = _allUsers.map(u => [
    u.regId || '', u.name, u.email, u.phone || '',
    u.event, u.timestamp ? new Date(u.timestamp).toLocaleString('en-IN') : ''
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'techfest_registrations.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported', 'CSV file downloaded.', 'success');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

initAdmin();

// ─── NEWS FEED ───────────────────────────────────────────
async function loadNews() {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = Array(4).fill(`
    <div class="card skeleton">
      <div class="skel-img"></div>
      <div class="skel-line w80"></div>
      <div class="skel-line w50"></div>
    </div>`).join('');

  try {
    const res  = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=4');
    const data = await res.json();
    container.innerHTML = '';
    data.results.forEach((n, i) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <img src="${n.image_url}" alt="${escHtml(n.title)}" loading="lazy">
        <div class="news-tag"><i class="fas fa-circle"></i> Live Intel</div>
        <h3>${escHtml(n.title)}</h3>
        <a href="${n.url}" target="_blank" rel="noopener" class="read-more">
          Read Intel <i class="fas fa-arrow-right"></i>
        </a>`;
      container.appendChild(div);
      setTimeout(() => div.classList.add('visible'), i * 120);
    });
  } catch(err) {
    container.innerHTML = `
      <div class="card" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <i class="fas fa-satellite" style="font-size:2rem;color:var(--muted);opacity:0.4;margin-bottom:16px;display:block;"></i>
        <p style="color:var(--muted);font-family:'Fira Code',monospace;font-size:0.85rem;">Signal lost — unable to intercept data feed.</p>
      </div>`;
  }
}
loadNews();

// ─── FLOATING HELP WIDGET ────────────────────────────────
(function initHelpWidget() {
  const widgetHtml = `
    <div class="help-widget">
      <div class="help-window" id="help-window">
        <h4><i class="fas fa-headset"></i> Need Help?</h4>
        <p>TechFest Support is currently offline. Please leave a message.</p>
        <div class="faq-section" style="margin-bottom: 15px; max-height: 120px; overflow-y: auto; font-size: 0.8rem; color: var(--muted); border: 1px solid rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3);">
          <strong style="color:var(--orange);">FAQ:</strong><br>
          <strong style="color:var(--white);">Q: Where is the event?</strong><br>A: Hybrid (In-person & Remote).<br>
          <strong style="color:var(--white);margin-top:6px;display:inline-block;">Q: Are laptops provided?</strong><br>A: No, please bring your own.<br>
          <strong style="color:var(--white);margin-top:6px;display:inline-block;">Q: Is food free?</strong><br>A: Yes, meals and energy drinks are provided.
        </div>
        <textarea class="chat-input" rows="2" placeholder="Type your message..."></textarea>
        <button class="send-btn" onclick="sendHelpMessage(this)"><i class="fas fa-paper-plane"></i> Send</button>
      </div>
      <button class="help-btn" id="help-btn" aria-label="Help">
        <i class="fas fa-comment-dots"></i>
      </button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const helpBtn = document.getElementById('help-btn');
  const helpWindow = document.getElementById('help-window');

  helpBtn.addEventListener('click', () => {
    helpWindow.classList.toggle('show');
    if (helpWindow.classList.contains('show')) {
      helpBtn.innerHTML = '<i class="fas fa-times"></i>';
    } else {
      helpBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
    }
  });
})();

window.sendHelpMessage = function(btn) {
  const input = btn.previousElementSibling;
  if (!input.value.trim()) return;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  setTimeout(() => {
    btn.innerHTML = originalHtml;
    input.value = '';
    showToast('Message Sent', 'Support will respond to your email soon.', 'success');
    document.getElementById('help-window').classList.remove('show');
    document.getElementById('help-btn').innerHTML = '<i class="fas fa-comment-dots"></i>';
  }, 1000);
};
