/**
 * HR Planner frontend controller (localStorage-based prototype)
 * - Enhanced with richer, lightweight animations and micro-interactions
 * - Features added:
 *   - animated counters on dashboard
 *   - staggered, animated card entry for lists (employees, tasks, jobs, candidates, notifications)
 *   - toast improvements with progress bar and slide-in/out animation
 *   - subtle confetti burst on successful demo login
 *   - pulse animation for notification badge when unread items exist
 *   - button ripple effect for .btn elements
 *   - improved addNotification flow that animates toasts + updates badge
 *
 * Keep this file as a drop-in replacement for your existing script.js
 */

const DEMO_USER = { username: 'hr', password: '1234', name: 'HR Manager' };

// localStorage keys
const LS_KEYS = {
  SESSION: 'hr_session',
  EMPLOYEES: 'hr_employees',
  ATTENDANCE: 'hr_attendance',
  TASKS: 'hr_tasks',
  JOBS: 'hr_jobs',
  CANDIDATES: 'hr_candidates',
  NOTIFS: 'hr_notifications',
};

document.addEventListener('DOMContentLoaded', () => {
  initData();
  attachLogin();
  attachThemeToggle();
  protectPages();
  attachGlobalButtonRipple();
  renderIfPresent();
});

/* ---------- Initialization and demo data ---------- */
function initData() {
  if (!localStorage.getItem(LS_KEYS.EMPLOYEES)) {
    const sample = [
      { id: 'E001', name: 'Alice Johnson', department: 'Engineering', contact: 'alice@company.com', joining: '2020-04-12', active: true, role: 'Software Engineer' },
      { id: 'E002', name: 'Bob Smith', department: 'Marketing', contact: 'bob@company.com', joining: '2019-08-23', active: true, role: 'Marketing Lead' },
      { id: 'E003', name: 'Cathy Brown', department: 'Sales', contact: 'cathy@company.com', joining: '2021-11-01', active: false, role: 'Sales Executive' }
    ];
    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(sample));
  }

  if (!localStorage.getItem(LS_KEYS.ATTENDANCE)) {
    const sampleAtt = [
      { empId: 'E001', date: '2025-11-01', status: 'Present' },
      { empId: 'E002', date: '2025-11-01', status: 'Absent' },
      { empId: 'E001', date: '2025-11-02', status: 'Present' }
    ];
    localStorage.setItem(LS_KEYS.ATTENDANCE, JSON.stringify(sampleAtt));
  }

  if (!localStorage.getItem(LS_KEYS.TASKS)) localStorage.setItem(LS_KEYS.TASKS, JSON.stringify([]));
  if (!localStorage.getItem(LS_KEYS.JOBS)) localStorage.setItem(LS_KEYS.JOBS, JSON.stringify([]));
  if (!localStorage.getItem(LS_KEYS.CANDIDATES)) localStorage.setItem(LS_KEYS.CANDIDATES, JSON.stringify([]));
  if (!localStorage.getItem(LS_KEYS.NOTIFS)) localStorage.setItem(LS_KEYS.NOTIFS, JSON.stringify([]));
}

/* ---------- Simple Auth & Session (animated) ---------- */
function attachLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const err = document.getElementById('errorMsg');

    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      const session = { username: DEMO_USER.username, name: DEMO_USER.name, loggedAt: new Date().toISOString() };
      localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session));

      // celebration + toast + redirect
      showToast('Login successful — welcome!', { type: 'success', duration: 1400 });
      confettiBurst(); // quick client-side confetti visual
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      if (err) err.textContent = 'Invalid Username or Password!';
      shakeElement(form);
      showToast('Login failed — check credentials', { type: 'danger', duration: 2000 });
    }
  });
}

function requireAuth() {
  return !!localStorage.getItem(LS_KEYS.SESSION);
}

function protectPages() {
  // redirect to login when not authenticated (except index.html)
  const path = location.pathname.toLowerCase();
  const isLoginPage = path.endsWith('index.html') || path.endsWith('\\') || path.endsWith('index.htm') || path === '/' || path.endsWith('login.html');
  if (!isLoginPage && !requireAuth()) {
    window.location.href = 'index.html';
  }

  // highlight current page in navigation
  const currentPage = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

function logout() {
  localStorage.removeItem(LS_KEYS.SESSION);
  window.location.href = 'index.html';
}

/* ---------- Theme Toggle ---------- */
function attachThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  // restore preference (if stored)
  const saved = localStorage.getItem('hr_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    btn.textContent = '☀️';
  } else {
    btn.textContent = '🌙';
  }

  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('hr_theme', isDark ? 'dark' : 'light');
    // toast feedback
    showToast(isDark ? 'Dark mode on' : 'Light mode on', { type: 'info', duration: 900 });
  });
}

/* ---------- Data helpers ---------- */
function read(key) { return JSON.parse(localStorage.getItem(key) || 'null'); }
function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// Employees CRUD
function getEmployees() { return read(LS_KEYS.EMPLOYEES) || []; }
function saveEmployees(list) { write(LS_KEYS.EMPLOYEES, list); }
function addEmployee(emp) {
  const list = getEmployees();
  list.unshift(emp);
  saveEmployees(list);
  addNotification('New employee added: ' + emp.name);
}
function updateEmployee(id, updates) {
  const list = getEmployees();
  const idx = list.findIndex(e => e.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    saveEmployees(list);
    addNotification('Employee updated: ' + list[idx].name);
    return true;
  }
  return false;
}
function deleteEmployee(id) {
  let list = getEmployees();
  list = list.filter(e => e.id !== id);
  saveEmployees(list);
  addNotification('Employee removed: ' + id);
}

/* Attendance */
function getAttendance() { return read(LS_KEYS.ATTENDANCE) || []; }
function addAttendance(record) {
  const list = getAttendance();
  list.unshift(record);
  write(LS_KEYS.ATTENDANCE, list);
}

function generateAttendanceSummary() {
  const att = getAttendance();
  const summary = { Present: 0, Absent: 0, 'On Leave': 0 };
  att.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });
  return summary;
}

/* Tasks */
function getTasks() { return read(LS_KEYS.TASKS) || []; }
function addTask(task) {
  const list = getTasks();
  list.unshift(task);
  write(LS_KEYS.TASKS, list);
  addNotification('New task/meeting: ' + task.title + ' on ' + task.date);
}

/* Jobs & candidates */
function getJobs() { return read(LS_KEYS.JOBS) || []; }
function addJob(job) { const list = getJobs(); list.unshift(job); write(LS_KEYS.JOBS, list); }

function getCandidates() { return read(LS_KEYS.CANDIDATES) || []; }
function addCandidate(c) { const list = getCandidates(); list.unshift(c); write(LS_KEYS.CANDIDATES, list); addNotification('Candidate uploaded: ' + c.name); }
function shortlistCandidate(candidateId) {
  const list = getCandidates();
  const idx = list.findIndex(c => c.id === candidateId);
  if (idx !== -1) { list[idx].shortlisted = true; write(LS_KEYS.CANDIDATES, list); addNotification('Candidate shortlisted: ' + list[idx].name); }
}

/* Notifications */
function getNotifications() { return read(LS_KEYS.NOTIFS) || []; }
function addNotification(text) {
  const list = getNotifications();
  const n = { id: 'N' + Date.now(), text, date: new Date().toISOString(), read: false };
  list.unshift(n);
  write(LS_KEYS.NOTIFS, list);
  updateNotifBadge(); // update badge immediately
  // show animated toast for important notifications
  showToast(text, { type: 'info', duration: 2600 });
}
function markNotifRead(id) {
  const list = getNotifications();
  const idx = list.findIndex(n => n.id === id);
  if (idx !== -1) { list[idx].read = true; write(LS_KEYS.NOTIFS, list); updateNotifBadge(); }
}

/* ---------- Rendering helpers for pages (with animations) ---------- */
function renderIfPresent() {
  const empCountEl = document.getElementById('empCount');
  if (empCountEl) renderDashboard();

  if (document.getElementById('employeesTable')) renderEmployeesPage();
  if (document.getElementById('attendanceTable')) renderAttendancePage();
  if (document.getElementById('tasksList')) renderTasksPage();
  if (document.getElementById('jobsList')) renderJobsPage();
  if (document.getElementById('candidatesList')) renderCandidatesPage();
  if (document.getElementById('notificationsList')) renderNotificationsPage();

  try { updateNotifBadge(); } catch (e) { }
}

function renderDashboard() {
  const session = JSON.parse(localStorage.getItem(LS_KEYS.SESSION) || 'null');
  const welcome = document.getElementById('welcomeHeading');
  if (welcome && session) welcome.textContent = `Welcome, ${session.name}`;

  // animated counters
  animateCount('#empCount', getEmployees().length);
  animateCount('#pendingLeaves', Math.floor(Math.random()*6));
  animateCount('#upcomingInterviews', Math.floor(Math.random()*5));

  const summary = generateAttendanceSummary();
  const ctx = document.getElementById('attendanceChart');
  if (ctx) {
    const data = [summary.Present || 0, summary.Absent || 0, summary['On Leave'] || 0];
    // eslint-disable-next-line no-undef
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Present','Absent','On Leave'], datasets: [{ data, backgroundColor: ['#4CAF50','#F44336','#FFC107'] }] },
      options: { animation: { animateRotate: true, animateScale: true }, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // optional: reveal stat cards with stagger
  staggerReveal('.card', 80);
}

/* Employees page rendering and form handling (staggered entry) */
function renderEmployeesPage() {
  const table = document.getElementById('employeesTable');
  const list = getEmployees();
  table.innerHTML = '';

  // Search and filter elements
  const searchEl = document.getElementById('empSearch');
  const deptFilter = document.getElementById('empDeptFilter');
  let filtered = list.slice();
  if (searchEl && searchEl.value.trim()) {
    const q = searchEl.value.trim().toLowerCase();
    filtered = filtered.filter(e => (e.name || '').toLowerCase().includes(q) || (e.id || '').toLowerCase().includes(q));
  }
  if (deptFilter && deptFilter.value) {
    filtered = filtered.filter(e => e.department === deptFilter.value);
  }

  // build rows then animate them in with a slight stagger
  filtered.forEach((emp, idx) => {
    const tr = document.createElement('tr');
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(8px)';
    tr.innerHTML = `
      <td><div class="cell-content">${emp.id}</div></td>
      <td><div class="cell-content">${emp.name}</div></td>
      <td><div class="cell-content">${emp.department}</div></td>
      <td><div class="cell-content">${emp.role || ''}</div></td>
      <td><div class="cell-content">${emp.contact}</div></td>
      <td><div class="cell-content">${emp.joining}</div></td>
      <td><div class="cell-content ${emp.active ? 'status-active' : 'status-inactive'}">${emp.active ? 'Active' : 'Inactive'}</div></td>
      <td>
        <button class="action-btn" onclick="onEditEmployee('${emp.id}')">
          <span>✎</span>
          <span class="tooltip">Edit</span>
        </button>
        <button class="action-btn delete" onclick="onDeleteEmployee('${emp.id}')">
          <span>×</span>
          <span class="tooltip">Delete</span>
        </button>
      </td>
    `;
    table.appendChild(tr);
    // staggered reveal
    setTimeout(() => {
      tr.style.transition = 'all 360ms cubic-bezier(.2,.9,.2,1)';
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    }, 60 * idx);
  });

  // populate dept filter options
  if (deptFilter) {
    const depts = Array.from(new Set(list.map(e => e.department).filter(Boolean)));
    const selected = deptFilter.value || '';
    deptFilter.innerHTML = '<option value="">All Departments</option>' + depts.map(d => `<option value="${d}" ${d===selected? 'selected':''}>${d}</option>`).join('');
  }

  if (searchEl) searchEl.oninput = () => renderEmployeesPage();
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) clearBtn.onclick = () => { if (searchEl) searchEl.value=''; if (deptFilter) deptFilter.value=''; renderEmployeesPage(); };
  if (deptFilter) deptFilter.onchange = () => renderEmployeesPage();

  const form = document.getElementById('employeeForm');
  if (form && !form._bound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emp = {
        id: document.getElementById('empId').value || 'E' + Date.now(),
        name: document.getElementById('empName').value,
        department: document.getElementById('empDept').value,
        contact: document.getElementById('empContact').value,
        joining: document.getElementById('empJoining').value,
        role: document.getElementById('empRole').value,
        active: true
      };
      addEmployee(emp);
      form.reset();
      renderEmployeesPage();
    });
    form._bound = true;
  }
}

function onEditEmployee(id) {
  const list = getEmployees();
  const emp = list.find(e => e.id === id);
  if (!emp) return;
  document.getElementById('empId').value = emp.id;
  document.getElementById('empName').value = emp.name;
  document.getElementById('empDept').value = emp.department;
  document.getElementById('empContact').value = emp.contact;
  document.getElementById('empJoining').value = emp.joining;
  document.getElementById('empRole').value = emp.role || '';
  const form = document.getElementById('employeeForm');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      updateEmployee(id, {
        name: document.getElementById('empName').value,
        department: document.getElementById('empDept').value,
        contact: document.getElementById('empContact').value,
        joining: document.getElementById('empJoining').value,
        role: document.getElementById('empRole').value
      });
      form.reset();
      form.onsubmit = null;
      renderEmployeesPage();
    };
  }
}

function onDeleteEmployee(id) {
  if (!confirm('Delete employee ' + id + '?')) return;
  deleteEmployee(id);
  renderEmployeesPage();
}

/* Attendance page */
function renderAttendancePage() {
  const table = document.getElementById('attendanceTable');
  const list = getAttendance();
  table.innerHTML = '';
  list.forEach((a, idx) => {
    const tr = document.createElement('tr');
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(6px)';
    tr.innerHTML = `<td>${a.empId}</td><td>${a.date}</td><td>${a.status}</td>`;
    table.appendChild(tr);
    setTimeout(() => {
      tr.style.transition = 'all 300ms ease';
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    }, idx * 40);
  });

  const form = document.getElementById('attendanceForm');
  if (form && !form._bound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rec = { empId: document.getElementById('attEmpId').value, date: document.getElementById('attDate').value, status: document.getElementById('attStatus').value };
      addAttendance(rec);
      form.reset();
      renderAttendancePage();
      renderDashboard();
    });
    form._bound = true;
  }
}

/* Tasks page */
function renderTasksPage() {
  const list = getTasks();
  const el = document.getElementById('tasksList');
  el.innerHTML = '';
  list.forEach((t, idx) => {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    div.innerHTML = `<h4>${t.title}</h4><p>${t.date} ${t.time || ''}</p><p>${t.description || ''}</p>`;
    el.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'all 360ms cubic-bezier(.2,.9,.2,1)';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, idx * 70);
  });
  const form = document.getElementById('taskForm');
  if (form && !form._bound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask({ id: 'T'+Date.now(), title: document.getElementById('taskTitle').value, date: document.getElementById('taskDate').value, time: document.getElementById('taskTime').value, description: document.getElementById('taskDesc').value });
      form.reset();
      renderTasksPage();
    });
    form._bound = true;
  }
}

/* Jobs & candidates */
function renderJobsPage() {
  const list = getJobs();
  const el = document.getElementById('jobsList');
  el.innerHTML = '';
  list.forEach((j, idx) => {
    const div = document.createElement('div');
    div.className='job-card';
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    div.innerHTML = `<h4>${j.title} <small>${j.department}</small></h4><p>${j.description}</p>`;
    el.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'all 340ms cubic-bezier(.2,.9,.2,1)';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, idx * 60);
  });
  const form = document.getElementById('jobForm');
  if (form && !form._bound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addJob({ id: 'J'+Date.now(), title: document.getElementById('jobTitle').value, department: document.getElementById('jobDept').value, description: document.getElementById('jobDesc').value });
      form.reset();
      renderJobsPage();
    });
    form._bound = true;
  }
}

function renderCandidatesPage() {
  const list = getCandidates();
  const el = document.getElementById('candidatesList');
  el.innerHTML = '';
  list.forEach((c, idx) => {
    const div = document.createElement('div');
    div.className = 'candidate-card';
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    div.innerHTML = `<h4>${c.name}</h4><p>${c.email}</p><p>CV: ${c.cvName || '—'}</p><p>Shortlisted: ${c.shortlisted ? 'Yes' : 'No'}</p><button class="btn small" onclick="shortlistCandidate('${c.id}')">Shortlist</button>`;
    el.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'all 320ms cubic-bezier(.2,.9,.2,1)';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, idx * 70);
  });
  const form = document.getElementById('candidateForm');
  if (form && !form._bound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = document.getElementById('candidateCV').files[0];
      const reader = new FileReader();
      const id = 'C' + Date.now();
      reader.onload = function(ev) {
        addCandidate({ id, name: document.getElementById('candidateName').value, email: document.getElementById('candidateEmail').value, cvName: file ? file.name : '', cvData: ev.target.result, shortlisted: false });
        form.reset();
        renderCandidatesPage();
      };
      if (file) reader.readAsDataURL(file); else { addCandidate({ id, name: document.getElementById('candidateName').value, email: document.getElementById('candidateEmail').value, cvName: '', cvData: '', shortlisted: false }); form.reset(); renderCandidatesPage(); }
    });
    form._bound = true;
  }
}

function renderNotificationsPage() {
  const list = getNotifications();
  const el = document.getElementById('notificationsList');
  el.innerHTML = '';
  list.forEach((n, idx) => {
    const div = document.createElement('div');
    div.className = 'notif' + (n.read ? ' read' : '');
    div.style.opacity = '0';
    div.style.transform = 'translateX(-8px)';
    div.innerHTML = `<p>${n.text}</p><small>${new Date(n.date).toLocaleString()}</small><button class="btn small" onclick="markNotifRead('${n.id}'); renderNotificationsPage();">Mark read</button>`;
    el.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'all 300ms ease';
      div.style.opacity = '1';
      div.style.transform = 'translateX(0)';
    }, idx * 60);
  });
}

/* Notification badge with pulse */
function updateNotifBadge() {
  const list = getNotifications();
  const unread = (list || []).filter(n => !n.read).length;
  const navLink = document.querySelector('a[href="notifications.html"]');
  if (!navLink) return;
  let badge = navLink.querySelector('.notif-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'notif-badge';
    navLink.appendChild(badge);
  }
  badge.textContent = unread > 0 ? unread : '';
  badge.style.display = unread > 0 ? 'inline-block' : 'none';

  // pulse when unread present
  if (unread > 0) {
    badge.classList.add('attention');
    // subtle animation via transform
    badge.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.08)', opacity: 0.95 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 900, iterations: 2, easing: 'ease-in-out' });
  } else {
    badge.classList.remove('attention');
  }
}

/* ---------- Utility Animations & Helpers ---------- */

// basic count up animation for numeric stat elements (#selector)
function animateCount(selector, target, duration = 900) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const start = Number(el.textContent) || 0;
  const diff = target - start;
  if (diff === 0) {
    el.textContent = target;
    return;
  }
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(start + diff * ease);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

// stagger reveal of elements matching selector
function staggerReveal(selector, delay = 60) {
  const els = document.querySelectorAll(selector);
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => {
      el.style.transition = 'all 420ms cubic-bezier(.2,.9,.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * delay);
  });
}

// small shake animation
function shakeElement(el) {
  if (!el) return;
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-8px)' },
    { transform: 'translateX(8px)' },
    { transform: 'translateX(0)' }
  ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
}

/* ========== Toasts (slide in + progress) ========== */
function showToast(message, { type = 'info', duration = 3500 } = {}) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px) scale(.98)';

  // icon
  const icon = document.createElement('div');
  icon.className = 'avatar';
  icon.style.width = '36px';
  icon.style.height = '36px';
  icon.style.display = 'grid';
  icon.style.placeItems = 'center';
  icon.style.fontWeight = '700';
  icon.style.color = '#fff';
  icon.style.marginRight = '8px';
  if (type === 'success') {
    icon.innerText = '✓';
    icon.style.background = 'linear-gradient(180deg,#4CAF50,#3a9f45)';
  } else if (type === 'danger') {
    icon.innerText = '!';
    icon.style.background = 'linear-gradient(180deg,#e53935,#b72b24)';
  } else {
    icon.innerText = 'i';
    icon.style.background = 'linear-gradient(180deg,var(--primary),var(--primary-dark))';
  }

  const text = document.createElement('div');
  text.style.flex = '1';
  text.style.fontSize = '14px';
  text.textContent = message;

  // progress bar
  const progress = document.createElement('div');
  progress.style.height = '4px';
  progress.style.background = 'rgba(0,0,0,0.06)';
  progress.style.borderRadius = '3px';
  progress.style.marginTop = '8px';
  progress.style.overflow = 'hidden';
  progress.style.position = 'relative';
  const bar = document.createElement('i');
  bar.style.display = 'block';
  bar.style.height = '100%';
  bar.style.width = '100%';
  bar.style.transformOrigin = 'left center';
  bar.style.background = 'linear-gradient(90deg,var(--primary),var(--primary-dark))';
  bar.style.transition = `transform ${duration}ms linear`;
  progress.appendChild(bar);

  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.appendChild(text);
  content.appendChild(progress);

  toast.appendChild(icon);
  toast.appendChild(content);
  wrap.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    toast.style.transition = 'all 320ms cubic-bezier(.2,.9,.2,1)';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
  });

  // start progress
  requestAnimationFrame(() => {
    bar.style.transform = 'scaleX(0)';
  });

  // remove after duration
  const remove = () => {
    toast.style.transition = 'all 300ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px) scale(.98)';
    setTimeout(() => {
      toast.remove();
      if (!wrap.children.length) wrap.remove();
    }, 320);
  };

  const timeoutId = setTimeout(remove, duration);
  // allow click to dismiss
  toast.addEventListener('click', () => { clearTimeout(timeoutId); remove(); });
}

/* ========== Confetti (lightweight) ========== */
function confettiBurst({ count = 18, spread = 120, duration = 800 } = {}) {
  // small non-blocking burst using DOM elements + CSS transforms (auto-removed)
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '50%';
  wrap.style.top = '35%';
  wrap.style.width = '0';
  wrap.style.height = '0';
  wrap.style.pointerEvents = 'none';
  wrap.style.zIndex = '9999';
  document.body.appendChild(wrap);

  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#D66BFF'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 10;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[i % colors.length];
    p.style.position = 'absolute';
    p.style.left = '0';
    p.style.top = '0';
    p.style.borderRadius = (Math.random() > 0.6) ? '50%' : '2px';
    p.style.opacity = '0.95';
    p.style.transform = `translate3d(0,0,0)`;
    p.style.willChange = 'transform, opacity';
    wrap.appendChild(p);

    // compute angle and velocity
    const angle = (-spread/2) + Math.random() * spread;
    const rad = (angle * Math.PI) / 180;
    const velocity = 80 + Math.random() * 160;
    const vx = Math.cos(rad) * velocity;
    const vy = Math.sin(rad) * velocity - (30 + Math.random() * 80);

    // animate with requestAnimationFrame + simple physics
    const start = performance.now();
    (function animateParticle(t0) {
      const tick = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        const x = vx * ease;
        const y = vy * ease + (300 * t * t); // gravity-ish
        p.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${ease * 720}deg)`;
        p.style.opacity = `${1 - ease}`;
        if (t < 1) requestAnimationFrame(tick);
        else p.remove();
      };
      requestAnimationFrame(tick);
    })();
  }

  setTimeout(() => { wrap.remove(); }, duration + 600);
}

/* ========== Button ripple: create ripple on .btn mousedown ========== */
function attachGlobalButtonRipple() {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height) * 1.6;
    ripple.style.position = 'absolute';
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.18)';
    ripple.style.pointerEvents = 'none';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0.9';
    ripple.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease';
    ripple.style.zIndex = '1';
    btn.style.position = btn.style.position || 'relative';
    btn.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });
    setTimeout(() => ripple.remove(), 520);
  });
}

/* ========== Expose some functions globally for inline handlers ========== */
window.logout = logout;
window.onEditEmployee = onEditEmployee;
window.onDeleteEmployee = onDeleteEmployee;
window.shortlistCandidate = shortlistCandidate;
window.markNotifRead = (id) => { markNotifRead(id); renderNotificationsPage(); };

// end of script
/* Lightweight interaction helpers to add more effects:
   - Pointer-based 3D tilt for .card elements inside .cards
   - Ensure notification badge pulse class toggles when unread exist
   - Minor enhancement: apply gradient-text class to brand title for style
   Include this after script.js (or merge into it).
*/

(function () {
  // Tilt effect: listens on cards container, applies transform on each .card
  function attachCardTilt() {
    const container = document.querySelector('.cards');
    if (!container || !window.PointerEvent) return;

    const cards = container.querySelectorAll('.card');
    let raf = null;

    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxTilt = 8; // degrees

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cards.forEach(card => {
          const r = card.getBoundingClientRect();
          const cardCx = r.left + r.width / 2;
          const cardCy = r.top + r.height / 2;
          // distance from pointer to card center
          const dx = e.clientX - cardCx;
          const dy = e.clientY - cardCy;
          // compute normalized tilt using size
          const nx = dx / (r.width / 2);
          const ny = dy / (r.height / 2);
          const rotateY = clamp((-nx) * maxTilt, -maxTilt, maxTilt);
          const rotateX = clamp((ny) * maxTilt, -maxTilt, maxTilt);
          card.style.transform = `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
          card.classList.add('tilt');
        });
      });
    }

    function onPointerLeave() {
      if (raf) cancelAnimationFrame(raf);
      cards.forEach(card => {
        card.style.transform = '';
        card.classList.remove('tilt');
      });
    }

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Toggle pulse class on notif badge if unread exist (keeps animation in sync)
  function syncNotifPulse() {
    const navLink = document.querySelector('a[href="notifications.html"]');
    if (!navLink) return;
    const badge = navLink.querySelector('.notif-badge');
    if (!badge) return;
    const unread = Number(badge.textContent) || 0;
    if (unread > 0) badge.classList.add('pulse');
    else badge.classList.remove('pulse');
  }

  // apply gradient heading to brand title for extra flair
  function styleBrand() {
    const title = document.getElementById('brandTitle') || document.querySelector('.brand > div');
    if (!title) return;
    title.classList.add('gradient-text');
  }

  // run on dom ready & also when content updates
  document.addEventListener('DOMContentLoaded', () => {
    attachCardTilt();
    styleBrand();
    // sync badge every 1.2s (keeps pulse when notifications update)
    setInterval(syncNotifPulse, 1200);
  });

  // Expose helper for manual sync if needed
  window.syncNotifPulse = syncNotifPulse;
})();