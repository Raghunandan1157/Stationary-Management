// ============================================================
// Stationary Management App - StockRegister
// localStorage + Supabase integration
// ============================================================

// --- SUPABASE ---

const SUPABASE_URL = 'https://zovnmmdfthpbubrorsgh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvdm5tbWRmdGhwYnVicm9yc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzE3ODgsImV4cCI6MjA3NzE0Nzc4OH0.92BH2sjUOgkw6iSRj1_4gt0p3eThg3QT4VK-Q4EdmBE';

// Helper: direct REST fetch from Supabase (works regardless of client lib)
async function supabaseFetch(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function supabaseInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Insert error: ${res.status} ${errText}`);
  }
  return true;
}

// --- SESSION ---

let currentEmployee = null;  // { id, emp_id, name, role, mobile, location }
let selectedLocation = null;

// --- LOGIN FLOW ---

async function initLogin() {
  const select = document.getElementById('login-location-select');
  const errorEl = document.getElementById('login-error');

  if (select) select.innerHTML = '<option value="" disabled selected>Loading locations...</option>';

  try {
    // Use direct REST API — no client library dependency
    const data = await supabaseFetch('employees', 'select=location&location=not.is.null');

    const locations = [...new Set(data.map(e => e.location).filter(Boolean))].sort();

    if (!select) return;

    if (locations.length === 0) {
      select.innerHTML = '<option value="" disabled selected>No locations found</option>';
      return;
    }

    select.innerHTML = '<option value="" disabled selected>Choose a location...</option>' +
      locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
  } catch (err) {
    console.error('Failed to load locations:', err);
    if (select) select.innerHTML = '<option value="" disabled selected>Failed to load</option>';
    if (errorEl) {
      errorEl.textContent = 'Failed to load locations: ' + err.message;
      errorEl.classList.remove('hidden');
    }
  }
}

async function loginSelectLocation() {
  const select = document.getElementById('login-location-select');
  const errorEl = document.getElementById('login-error');
  const location = select ? select.value : '';

  if (!location) {
    errorEl.textContent = 'Please select a location';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');
  selectedLocation = location;

  try {
    // Fetch employees at this location with role = 'BOE' via REST
    const data = await supabaseFetch('employees', `select=*&location=eq.${encodeURIComponent(location)}&role=eq.BOE`);

    if (!data || data.length === 0) {
      errorEl.textContent = 'No BOE profiles found at this location.';
      errorEl.classList.remove('hidden');
      return;
    }

    // Auto-select if only 1 BOE profile
    if (data.length === 1) {
      currentEmployee = data[0];
      loginConfirm();
      return;
    }

    // Render profile cards in step 2
    document.getElementById('login-welcome').textContent = location;
    const container = document.getElementById('login-profiles');
    container.innerHTML = data.map(emp => {
      const initials = emp.name ? emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
      return `
        <button onclick="selectProfile(this, ${emp.id})"
          data-emp='${JSON.stringify(emp).replace(/'/g, "&#39;")}'
          class="profile-option w-full flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div class="size-11 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${initials}</div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-800 dark:text-white text-sm truncate">${emp.name || 'Unknown'}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">${emp.emp_id || ''} &middot; ${emp.role || ''}</p>
          </div>
          <span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-base">chevron_right</span>
        </button>
      `;
    }).join('');

    // Show step 2
    document.getElementById('login-step1').classList.add('hidden');
    document.getElementById('login-step2').classList.remove('hidden');

  } catch (err) {
    errorEl.textContent = 'Connection error: ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

function selectProfile(el, empId) {
  // Highlight selected
  document.querySelectorAll('.profile-option').forEach(btn => {
    btn.classList.remove('border-primary', 'bg-primary/5', 'dark:bg-primary/10');
    btn.classList.add('border-slate-200', 'dark:border-slate-700');
  });
  el.classList.remove('border-slate-200', 'dark:border-slate-700');
  el.classList.add('border-primary', 'bg-primary/5', 'dark:bg-primary/10');
  currentEmployee = JSON.parse(el.dataset.emp.replace(/&#39;/g, "'"));
}

function loginBack() {
  document.getElementById('login-step2').classList.add('hidden');
  document.getElementById('login-step1').classList.remove('hidden');
  currentEmployee = null;
}

function loginConfirm() {
  const locErr = document.getElementById('login-loc-error');

  if (!currentEmployee) {
    locErr.textContent = 'Please select your profile to continue';
    locErr.classList.remove('hidden');
    return;
  }

  locErr.classList.add('hidden');

  // Save session (both session + persistent localStorage)
  sessionStorage.setItem('sr_employee', JSON.stringify(currentEmployee));
  sessionStorage.setItem('sr_location', selectedLocation);
  localStorage.setItem('sr_employee', JSON.stringify(currentEmployee));
  localStorage.setItem('sr_location', selectedLocation);

  // Update app profile
  appData.profile.branch = selectedLocation;
  appData.profile.boe = 'Navachetana Livelihoods Pvt Ltd';
  saveData(appData);

  // Hide login, show app
  document.getElementById('login-screen').classList.add('hidden');

  // Update UI
  updateUserUI();

  // Always load fresh data from Supabase after login, then render
  loadFromSupabase().then(() => {
    saveData(appData);
    renderDashboard();
  });
}

function updateUserUI() {
  if (!currentEmployee) return;
  const initials = currentEmployee.name ? currentEmployee.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  document.querySelectorAll('.user-initials').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-name').forEach(el => el.textContent = currentEmployee.name || 'User');
  document.querySelectorAll('.user-role').forEach(el => el.textContent = currentEmployee.role || 'Staff');
}

function checkSession() {
  // Check sessionStorage first (current tab), then localStorage (persistent across tabs/sessions)
  const savedEmp = sessionStorage.getItem('sr_employee') || localStorage.getItem('sr_employee');
  const savedLoc = sessionStorage.getItem('sr_location') || localStorage.getItem('sr_location');

  if (savedEmp && savedLoc) {
    currentEmployee = JSON.parse(savedEmp);
    selectedLocation = savedLoc;
    // Keep both in sync
    sessionStorage.setItem('sr_employee', savedEmp);
    sessionStorage.setItem('sr_location', savedLoc);
    document.getElementById('login-screen').classList.add('hidden');
    updateUserUI();
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('sr_employee');
  sessionStorage.removeItem('sr_location');
  localStorage.removeItem('sr_employee');
  localStorage.removeItem('sr_location');
  currentEmployee = null;
  selectedLocation = null;
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-step1').classList.remove('hidden');
  document.getElementById('login-step2').classList.add('hidden');
  initLogin(); // reload locations
}

// Initialize login on load
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
});

// --- DATA LAYER ---

const STORAGE_KEY = 'stockregister_data';
const DATA_VERSION = 7; // Redesigned profile card + company name fix

const DEFAULT_TEAM = []; // Team members now loaded from Supabase

const DEFAULT_INVENTORY = [
  // Writing
  { id: 1, name: 'Ball Pen Blue', sku: '96081099', category: 'Writing', qty: 0, unit: 'No', reorder: 10, rate: 5.08, gst: 18 },
  { id: 2, name: 'Ball Pen Black', sku: '96081099', category: 'Writing', qty: 0, unit: 'No', reorder: 5, rate: 5.08, gst: 18 },
  { id: 3, name: 'Ball Pen Red', sku: '96081099', category: 'Writing', qty: 0, unit: 'No', reorder: 5, rate: 5.08, gst: 18 },
  { id: 4, name: 'Highlighter Pen', sku: '96082000', category: 'Writing', qty: 0, unit: 'No', reorder: 3, rate: 16.95, gst: 18 },
  { id: 5, name: 'Pencil', sku: '96091000', category: 'Writing', qty: 0, unit: 'No', reorder: 5, rate: 4.46, gst: 12 },
  // Paper & Covers
  { id: 6, name: 'Xerox Paper A4', sku: '48025690', category: 'Paper & Covers', qty: 0, unit: 'Ream', reorder: 5, rate: 267.86, gst: 12 },
  { id: 7, name: 'Brown Cover A4 Size', sku: '48203000', category: 'Paper & Covers', qty: 0, unit: 'No', reorder: 15, rate: 4.24, gst: 18 },
  { id: 8, name: 'Clothlined Cover A4', sku: '4817', category: 'Paper & Covers', qty: 0, unit: 'No', reorder: 15, rate: 5.51, gst: 18 },
  { id: 9, name: 'Carbon Paper', sku: '48162010', category: 'Paper & Covers', qty: 0, unit: 'No', reorder: 5, rate: 186.44, gst: 18 },
  // Filing
  { id: 10, name: 'Office File', sku: '48203000', category: 'Filing', qty: 0, unit: 'No', reorder: 10, rate: 18.64, gst: 18 },
  { id: 11, name: 'Lever Arch File', sku: '48203000', category: 'Filing', qty: 0, unit: 'No', reorder: 5, rate: 88.98, gst: 18 },
  { id: 12, name: 'Tag', sku: '48211010', category: 'Filing', qty: 0, unit: 'Bundle', reorder: 3, rate: 182.20, gst: 18 },
  // Books & Registers
  { id: 13, name: 'Register Books 100 Page', sku: '48201010', category: 'Books & Registers', qty: 0, unit: 'No', reorder: 5, rate: 127.12, gst: 18 },
  { id: 14, name: 'Register Books 200 Page', sku: '48201090', category: 'Books & Registers', qty: 0, unit: 'No', reorder: 5, rate: 127.12, gst: 18 },
  { id: 15, name: 'Cash Book', sku: '48201010', category: 'Books & Registers', qty: 0, unit: 'No', reorder: 2, rate: 199.15, gst: 18 },
  { id: 16, name: 'King Size Book 100 Pages', sku: '48202000', category: 'Books & Registers', qty: 0, unit: 'No', reorder: 3, rate: 31.25, gst: 12 },
  { id: 17, name: 'King Size Book 200 Pages', sku: '48202000', category: 'Books & Registers', qty: 0, unit: 'No', reorder: 3, rate: 31.25, gst: 12 },
  // Desk Supplies
  { id: 18, name: 'Eraser', sku: '40169200', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 5, rate: 3.81, gst: 5 },
  { id: 19, name: 'Sharpener', sku: '82141010', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 5, rate: 3.57, gst: 12 },
  { id: 20, name: 'Duster', sku: '39269099', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 5, rate: 33.90, gst: 18 },
  { id: 21, name: 'Drawing Pin', sku: '73170091', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 5, rate: 21.19, gst: 18 },
  { id: 22, name: 'Rubber Band', sku: '40169920', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 5, rate: 2.68, gst: 12 },
  { id: 23, name: 'Stamp Pad', sku: '96122000', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 3, rate: 35.59, gst: 18 },
  { id: 24, name: 'Stamp Pad Blue Ink', sku: '32159090', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 3, rate: 38.14, gst: 18 },
  { id: 25, name: 'Calculator', sku: '84701000', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 2, rate: 338.98, gst: 18 },
  { id: 26, name: 'White Board Marker', sku: '96082000', category: 'Desk Supplies', qty: 0, unit: 'No', reorder: 3, rate: 21.19, gst: 18 },
  // Tapes & Adhesives
  { id: 27, name: 'Glue Stick', sku: '35061000', category: 'Tapes & Adhesives', qty: 0, unit: 'No', reorder: 5, rate: 21.19, gst: 18 },
  { id: 28, name: 'Tixo Tape', sku: '39199020', category: 'Tapes & Adhesives', qty: 0, unit: 'No', reorder: 3, rate: 33.90, gst: 18 },
  { id: 29, name: 'Brown Tape', sku: '84778090', category: 'Tapes & Adhesives', qty: 0, unit: 'No', reorder: 3, rate: 33.90, gst: 18 },
  // Machines
  { id: 30, name: 'Stapler Machine', sku: '84729010', category: 'Machines', qty: 0, unit: 'No', reorder: 2, rate: 46.61, gst: 18 },
  { id: 31, name: 'Stapler Kangaro HP-45', sku: '84729010', category: 'Machines', qty: 0, unit: 'No', reorder: 1, rate: 148.31, gst: 18 },
  { id: 32, name: 'Small Stapler Pins', sku: '84729010', category: 'Machines', qty: 0, unit: 'No', reorder: 5, rate: 80.51, gst: 18 },
  { id: 33, name: 'Big Stapler Pins', sku: '83052000', category: 'Machines', qty: 0, unit: 'No', reorder: 5, rate: 127.12, gst: 18 },
  { id: 34, name: 'Punching Machine', sku: '84729099', category: 'Machines', qty: 0, unit: 'No', reorder: 2, rate: 101.69, gst: 18 },
];

const DEFAULT_TRANSACTIONS = [];

const DEFAULT_SUPPLIERS = [];

const DEFAULT_NOTIFICATIONS = [];

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed._version === DATA_VERSION) return parsed;
    // Stale data — clear and reload defaults
    localStorage.removeItem(STORAGE_KEY);
  }
  const data = {
    _version: DATA_VERSION,
    inventory: DEFAULT_INVENTORY,
    transactions: DEFAULT_TRANSACTIONS,
    team: DEFAULT_TEAM,
    suppliers: DEFAULT_SUPPLIERS,
    notifications: DEFAULT_NOTIFICATIONS,
    profile: {
      branch: 'Honnavar Branch',
      boe: 'Navachetana Livelihoods Pvt Ltd',
    },
  };
  saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let appData = loadData();

// --- SUPABASE DATA SYNC ---

async function loadFromSupabase() {
  if (!selectedLocation) return;

  try {
    // Fetch all stock entries for this location, newest first
    const entries = await supabaseFetch('stock_entries',
      'select=*&location=eq.' + encodeURIComponent(selectedLocation) + '&order=created_at.desc');

    // Reset inventory quantities to 0 from catalog
    appData.inventory = DEFAULT_INVENTORY.map(item => ({ ...item, qty: 0 }));

    // Compute quantities from Supabase entries
    entries.forEach(e => {
      const item = appData.inventory.find(i => i.name === e.item_name);
      if (item) {
        if (e.entry_type === 'in') item.qty += e.quantity;
        else item.qty = Math.max(0, item.qty - e.quantity);
      }
    });

    // Convert entries to local transactions format
    appData.transactions = entries.map(e => ({
      id: e.id,
      itemName: e.item_name,
      sku: e.hsn_code,
      type: e.entry_type,
      qty: e.quantity,
      date: e.created_at,
      user: e.emp_name,
    }));

    // Generate notifications for low/out-of-stock items
    appData.notifications = [];
    appData.inventory.forEach(item => {
      if (item.qty <= item.reorder) {
        appData.notifications.push({
          id: item.id,
          text: `${item.name} stock ${item.qty <= 0 ? 'depleted' : 'critically low'} (${item.qty} ${item.unit || 'units'})`,
          type: 'alert',
          time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        });
      }
    });

  } catch (err) {
    console.error('Failed to load from Supabase:', err);
    showToast('Failed to load data from server', 'delete');
  }
}

// --- NEW ENTRY STATE ---

let entryCart = {};       // maps itemId → selected quantity
let entryType = 'in';     // 'in' or 'out'
let activeCategory = 'All';
const CATEGORIES = ['All', 'Writing', 'Paper & Covers', 'Filing', 'Books & Registers', 'Desk Supplies', 'Tapes & Adhesives', 'Machines'];

// --- NAVIGATION ---

let currentPage = 'dashboard';

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('[id^="page-"]').forEach(el => {
    if (el.id === 'page-content') return;
    el.classList.add('hidden');
  });
  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === page) {
      link.className = 'nav-link flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold';
    } else {
      link.className = 'nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
    }
  });

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  renderPage(page);
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
});

// --- RENDER FUNCTIONS ---

function renderPage(page) {
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'inventory': renderInventory(); break;
    case 'transactions': renderTransactions(); break;
    case 'suppliers': renderSuppliers(); break;
    case 'reports': renderReports(); break;
    case 'newentry': renderNewEntryPage(); break;
  }
}

function renderDashboard() {
  // KPIs
  const totalQty = appData.inventory.reduce((sum, i) => sum + i.qty, 0);
  const lowStock = appData.inventory.filter(i => i.qty <= i.reorder).length;
  const monthIn = appData.transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.qty, 0);
  const monthOut = appData.transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.qty, 0);

  document.getElementById('kpi-closing-stock').textContent = totalQty.toLocaleString() + ' Units';
  document.getElementById('kpi-low-stock').textContent = lowStock + ' Items';
  document.getElementById('kpi-stock-in').textContent = monthIn.toLocaleString() + ' Units';
  document.getElementById('kpi-stock-out').textContent = monthOut.toLocaleString() + ' Units';

  // Profile
  document.getElementById('profile-branch').textContent = appData.profile.branch;
  document.getElementById('profile-boe').textContent = appData.profile.boe;

  // Update profile card with logged-in user data
  if (currentEmployee) {
    const initials = currentEmployee.name ? currentEmployee.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '??';
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.textContent = initials;
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = currentEmployee.name || 'User';
    const roleEl = document.getElementById('profile-role');
    if (roleEl) roleEl.textContent = currentEmployee.role || 'Staff';
    const empIdEl = document.getElementById('profile-empid');
    if (empIdEl) empIdEl.textContent = currentEmployee.emp_id || '--';

    // Fetch team size from Supabase
    if (selectedLocation) {
      supabaseFetch('employees', 'select=id&location=eq.' + encodeURIComponent(selectedLocation))
        .then(team => {
          const sizeEl = document.getElementById('profile-team-size');
          if (sizeEl) sizeEl.textContent = team.length + ' Members';
        }).catch(() => {});
    }
  }

  // Recent movements (last 5)
  const recent = [...appData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById('movements-table').innerHTML = recent.map(t => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <td class="px-6 py-4">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800 dark:text-slate-200">${escHtml(t.itemName)}</span>
          <span class="text-xs text-slate-400">${escHtml(t.sku)}</span>
        </div>
      </td>
      <td class="px-6 py-4">
        ${t.type === 'in'
          ? '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><span class="material-symbols-outlined text-[14px]">arrow_downward</span>Stock In</span>'
          : '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"><span class="material-symbols-outlined text-[14px]">arrow_upward</span>Stock Out</span>'
        }
      </td>
      <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${t.type === 'in' ? '+' : '-'}${t.qty}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${formatDate(t.date)}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${escHtml(t.user)}</td>
    </tr>
  `).join('');

  // Team grid — fetch real employees from same location via Supabase
  const teamGrid = document.getElementById('team-grid');
  const teamAvatars = document.getElementById('team-avatars');
  if (selectedLocation) {
    teamGrid.innerHTML = '<div class="col-span-full p-6 text-center text-slate-400 dark:text-slate-500 text-sm">Loading team...</div>';
    const TEAM_COLORS = ['from-primary to-blue-400','from-emerald-500 to-teal-400','from-violet-500 to-purple-400','from-amber-500 to-orange-400','from-rose-500 to-pink-400','from-cyan-500 to-sky-400','from-indigo-500 to-blue-400','from-lime-500 to-green-400'];
    supabaseFetch('employees', 'select=*&location=eq.' + encodeURIComponent(selectedLocation) + '&order=name.asc')
      .then(members => {
        if (!members.length) {
          teamGrid.innerHTML = '<div class="col-span-full p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No team members found</div>';
          teamAvatars.innerHTML = '';
          return;
        }
        teamGrid.innerHTML = members.map((m, i) => {
          const initials = m.name ? m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '??';
          const color = TEAM_COLORS[i % TEAM_COLORS.length];
          const memberData = encodeURIComponent(JSON.stringify(m));
          return `<div onclick="showTeamMemberModal(decodeURIComponent('${memberData}'), '${color}')" class="bg-white dark:bg-[#1c2631] p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <div class="size-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${initials}</div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-slate-800 dark:text-white truncate">${escHtml(m.name)}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">${escHtml(m.role)}</p>
            </div>
            <span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-base">chevron_right</span>
          </div>`;
        }).join('');
        teamAvatars.innerHTML = members.map((m, i) => {
          const initials = m.name ? m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '??';
          const color = TEAM_COLORS[i % TEAM_COLORS.length];
          return `<div class="size-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-[#161e27]" title="${escHtml(m.name)}">${initials}</div>`;
        }).join('');
      }).catch(() => {
        teamGrid.innerHTML = '<div class="col-span-full p-6 text-center text-red-400 text-sm">Failed to load team</div>';
      });
  } else {
    teamGrid.innerHTML = '<div class="col-span-full p-6 text-center text-slate-400 dark:text-slate-500 text-sm">Log in to see team members</div>';
    teamAvatars.innerHTML = '';
  }
}

function renderInventory() {
  const items = appData.inventory;
  document.getElementById('inventory-table').innerHTML = items.map(item => {
    let status, statusClass;
    if (item.qty <= 0) {
      status = 'Out of Stock'; statusClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    } else if (item.qty <= item.reorder) {
      status = 'Low Stock'; statusClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    } else {
      status = 'In Stock'; statusClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">${escHtml(item.name)}</td>
        <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">${escHtml(item.sku)}</td>
        <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${escHtml(item.category)}</td>
        <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${item.qty.toLocaleString()} ${escHtml(item.unit || 'No')}</td>
        <td class="px-6 py-4"><span class="py-1 px-2.5 rounded-full text-xs font-semibold ${statusClass}">${status}</span></td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button onclick="openModal('edit', ${item.id})" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-base">edit</span></button>
            <button onclick="deleteItem(${item.id})" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-base">delete</span></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTransactions() {
  const txns = [...appData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('transactions-table').innerHTML = txns.map(t => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <td class="px-6 py-4">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800 dark:text-slate-200">${escHtml(t.itemName)}</span>
          <span class="text-xs text-slate-400">${escHtml(t.sku)}</span>
        </div>
      </td>
      <td class="px-6 py-4">
        ${t.type === 'in'
          ? '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><span class="material-symbols-outlined text-[14px]">arrow_downward</span>Stock In</span>'
          : '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"><span class="material-symbols-outlined text-[14px]">arrow_upward</span>Stock Out</span>'
        }
      </td>
      <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${t.type === 'in' ? '+' : '-'}${t.qty}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${formatDate(t.date)}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${escHtml(t.user)}</td>
    </tr>
  `).join('');
}

function renderSuppliers() {
  document.getElementById('suppliers-grid').innerHTML = appData.suppliers.map(s => `
    <div class="bg-white dark:bg-[#1c2631] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <span class="p-2 bg-primary/10 text-primary rounded-lg">
          <span class="material-symbols-outlined">local_shipping</span>
        </span>
        <span class="py-1 px-2.5 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">${s.status === 'active' ? 'Active' : 'Inactive'}</span>
      </div>
      <h4 class="font-bold text-slate-800 dark:text-white mb-1">${escHtml(s.name)}</h4>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${escHtml(s.items)}</p>
      <div class="space-y-1 text-sm">
        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span class="material-symbols-outlined text-base">person</span>
          ${escHtml(s.contact)}
        </div>
        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span class="material-symbols-outlined text-base">phone</span>
          ${escHtml(s.phone)}
        </div>
      </div>
    </div>
  `).join('');
}

function renderReports() {
  const inv = appData.inventory;
  const txns = appData.transactions;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Today's transactions
  const todayTxns = txns.filter(t => t.date.slice(0, 10) === todayStr);
  const todayIn = todayTxns.filter(t => t.type === 'in');
  const todayOut = todayTxns.filter(t => t.type === 'out');
  const todayInQty = todayIn.reduce((s, t) => s + t.qty, 0);
  const todayOutQty = todayOut.reduce((s, t) => s + t.qty, 0);

  // Month-to-date transactions
  const mtdTxns = txns.filter(t => new Date(t.date) >= monthStart);
  const mtdIn = mtdTxns.filter(t => t.type === 'in');
  const mtdOut = mtdTxns.filter(t => t.type === 'out');
  const mtdInQty = mtdIn.reduce((s, t) => s + t.qty, 0);
  const mtdOutQty = mtdOut.reduce((s, t) => s + t.qty, 0);

  // Closing stock
  const closingStock = inv.reduce((s, i) => s + i.qty, 0);
  const lowStockCount = inv.filter(i => i.qty <= i.reorder).length;

  // Month name
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = monthNames[now.getMonth()];

  // Format today
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayFormatted = `${dayNames[now.getDay()]}, ${now.getDate()} ${currentMonth.slice(0,3)} ${now.getFullYear()}`;

  function buildRow(label, value, accent) {
    const valClass = accent === 'green' ? 'text-green-500' : accent === 'red' ? 'text-red-500' : 'font-bold text-slate-800 dark:text-white';
    return `
      <div class="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
        <span class="text-sm text-slate-500 dark:text-slate-400">${label}</span>
        <span class="font-bold ${valClass}">${value}</span>
      </div>`;
  }

  function buildTxnList(list) {
    if (list.length === 0) return '<p class="text-sm text-slate-400 dark:text-slate-500 py-2 text-center">No transactions</p>';
    return list.map(t => `
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="material-symbols-outlined text-sm ${t.type === 'in' ? 'text-green-500' : 'text-red-400'}">${t.type === 'in' ? 'arrow_downward' : 'arrow_upward'}</span>
          <span class="text-sm text-slate-700 dark:text-slate-300 truncate">${escHtml(t.itemName)}</span>
        </div>
        <span class="text-sm font-semibold ${t.type === 'in' ? 'text-green-500' : 'text-red-400'} flex-shrink-0 ml-3">${t.type === 'in' ? '+' : '-'}${t.qty}</span>
      </div>
    `).join('');
  }

  let html = '';

  // --- Column 1: Today's Report ---
  html += `
    <div class="bg-white dark:bg-[#1c2631] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 mb-1">
          <span class="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <span class="material-symbols-outlined">today</span>
          </span>
          <div>
            <h4 class="text-lg font-bold text-slate-800 dark:text-white">Today's Report</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">${todayFormatted}</p>
          </div>
        </div>
      </div>
      <div class="p-6 space-y-0">
        ${buildRow('Total Transactions', todayTxns.length)}
        ${buildRow('Stock In (entries)', todayIn.length)}
        ${buildRow('Stock In (qty)', '+' + todayInQty.toLocaleString() + ' units', 'green')}
        ${buildRow('Stock Out (entries)', todayOut.length)}
        ${buildRow('Stock Out (qty)', '-' + todayOutQty.toLocaleString() + ' units', 'red')}
        ${buildRow('Net Movement', (todayInQty - todayOutQty >= 0 ? '+' : '') + (todayInQty - todayOutQty).toLocaleString() + ' units')}
      </div>
      <div class="px-6 pb-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Today's Activity</p>
      </div>
      <div class="px-6 pb-6 max-h-48 overflow-y-auto">
        ${buildTxnList(todayTxns)}
      </div>
    </div>
  `;

  // --- Column 2: Month-to-Date Report ---
  html += `
    <div class="bg-white dark:bg-[#1c2631] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 mb-1">
          <span class="p-2 bg-primary/10 text-primary rounded-lg">
            <span class="material-symbols-outlined">date_range</span>
          </span>
          <div>
            <h4 class="text-lg font-bold text-slate-800 dark:text-white">Month to Date</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">1 ${currentMonth.slice(0,3)} – ${now.getDate()} ${currentMonth.slice(0,3)} ${now.getFullYear()}</p>
          </div>
        </div>
      </div>
      <div class="p-6 space-y-0">
        ${buildRow('Total Transactions', mtdTxns.length)}
        ${buildRow('Stock In (entries)', mtdIn.length)}
        ${buildRow('Stock In (qty)', '+' + mtdInQty.toLocaleString() + ' units', 'green')}
        ${buildRow('Stock Out (entries)', mtdOut.length)}
        ${buildRow('Stock Out (qty)', '-' + mtdOutQty.toLocaleString() + ' units', 'red')}
        ${buildRow('Net Movement', (mtdInQty - mtdOutQty >= 0 ? '+' : '') + (mtdInQty - mtdOutQty).toLocaleString() + ' units')}
        ${buildRow('Closing Stock', closingStock.toLocaleString() + ' units')}
        ${buildRow('Low Stock Items', lowStockCount, lowStockCount > 0 ? 'red' : '')}
      </div>
      <div class="px-6 pb-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">MTD Activity</p>
      </div>
      <div class="px-6 pb-6 max-h-48 overflow-y-auto">
        ${buildTxnList(mtdTxns)}
      </div>
    </div>
  `;

  document.getElementById('reports-content').innerHTML = html;
}

// --- KPI CLICK HANDLERS ---

function kpiClickClosingStock() {
  navigateTo('inventory');
}

function kpiClickLowStock() {
  navigateTo('inventory');
  const lowItems = appData.inventory.filter(i => i.qty <= i.reorder);
  renderFilteredInventory(lowItems);
  // Update header to indicate filter
  const header = document.querySelector('#page-inventory > div:first-child h2');
  if (header) header.textContent = 'Low Stock Items';
  const sub = document.querySelector('#page-inventory > div:first-child p');
  if (sub) sub.textContent = lowItems.length + ' items at or below reorder level';
}

function kpiClickStockIn() {
  navigateTo('transactions');
  const inTxns = appData.transactions.filter(t => t.type === 'in');
  renderFilteredTransactions(inTxns);
  const header = document.querySelector('#page-transactions > div:first-child h2');
  if (header) header.textContent = 'Stock In Transactions';
  const sub = document.querySelector('#page-transactions > div:first-child p');
  if (sub) sub.textContent = inTxns.length + ' stock in entries';
}

function kpiClickStockOut() {
  navigateTo('transactions');
  const outTxns = appData.transactions.filter(t => t.type === 'out');
  renderFilteredTransactions(outTxns);
  const header = document.querySelector('#page-transactions > div:first-child h2');
  if (header) header.textContent = 'Stock Out Transactions';
  const sub = document.querySelector('#page-transactions > div:first-child p');
  if (sub) sub.textContent = outTxns.length + ' stock out entries';
}

function renderFilteredTransactions(txns) {
  const sorted = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('transactions-table').innerHTML = sorted.map(t => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <td class="px-6 py-4">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800 dark:text-slate-200">${escHtml(t.itemName)}</span>
          <span class="text-xs text-slate-400">${escHtml(t.sku)}</span>
        </div>
      </td>
      <td class="px-6 py-4">
        ${t.type === 'in'
          ? '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><span class="material-symbols-outlined text-[14px]">arrow_downward</span>Stock In</span>'
          : '<span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"><span class="material-symbols-outlined text-[14px]">arrow_upward</span>Stock Out</span>'
        }
      </td>
      <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${t.type === 'in' ? '+' : '-'}${t.qty}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${formatDate(t.date)}</td>
      <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${escHtml(t.user)}</td>
    </tr>
  `).join('');
}

// --- MODAL / CRUD ---

function openModal(mode, id) {
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('item-form');

  form.reset();
  document.getElementById('form-edit-id').value = '';

  if (mode === 'edit' && id) {
    const item = appData.inventory.find(i => i.id === id);
    if (!item) return;
    title.textContent = 'Edit Item';
    document.getElementById('form-name').value = item.name;
    document.getElementById('form-sku').value = item.sku;
    document.getElementById('form-category').value = item.category;
    document.getElementById('form-qty').value = item.qty;
    document.getElementById('form-reorder').value = item.reorder;
    document.getElementById('form-edit-id').value = item.id;
  } else {
    title.textContent = 'Add New Item';
  }

  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

document.getElementById('item-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const editId = document.getElementById('form-edit-id').value;
  const item = {
    name: document.getElementById('form-name').value.trim(),
    sku: document.getElementById('form-sku').value.trim(),
    category: document.getElementById('form-category').value,
    qty: parseInt(document.getElementById('form-qty').value, 10),
    reorder: parseInt(document.getElementById('form-reorder').value, 10),
  };

  if (editId) {
    const idx = appData.inventory.findIndex(i => i.id === parseInt(editId, 10));
    if (idx !== -1) {
      appData.inventory[idx] = { ...appData.inventory[idx], ...item };
      showToast('Item updated successfully');
    }
  } else {
    item.id = Date.now();
    appData.inventory.push(item);
    showToast('Item added successfully');
  }

  saveData(appData);
  closeModal();
  renderPage(currentPage);
});

function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  appData.inventory = appData.inventory.filter(i => i.id !== id);
  saveData(appData);
  showToast('Item deleted', 'delete');
  renderPage(currentPage);
}

// --- HEADER BUTTONS ---

document.getElementById('new-entry-btn').addEventListener('click', () => {
  navigateTo('newentry');
});

document.getElementById('notif-btn').addEventListener('click', () => {
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('hidden');
  renderNotifications();
});

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (appData.notifications.length === 0) {
    list.innerHTML = '<div class="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">No notifications</div>';
    document.getElementById('notif-badge').classList.add('hidden');
    return;
  }
  document.getElementById('notif-badge').classList.remove('hidden');
  list.innerHTML = appData.notifications.map(n => `
    <div class="p-4 flex items-start gap-3">
      <span class="material-symbols-outlined text-base mt-0.5 ${n.type === 'alert' ? 'text-red-500' : 'text-primary'}">${n.type === 'alert' ? 'error' : 'info'}</span>
      <div class="min-w-0">
        <p class="text-sm text-slate-700 dark:text-slate-300">${escHtml(n.text)}</p>
        <p class="text-xs text-slate-400 mt-1">${escHtml(n.time)}</p>
      </div>
    </div>
  `).join('');
}

function clearNotifications() {
  appData.notifications = [];
  saveData(appData);
  renderNotifications();
}

// Close notif panel on outside click
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notif-panel');
  const btn = document.getElementById('notif-btn');
  if (!panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.add('hidden');
  }
});

// --- SEARCH ---

document.getElementById('search-input').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  if (!q) {
    renderPage(currentPage);
    return;
  }
  // Search inventory and navigate there
  if (currentPage !== 'inventory') navigateTo('inventory');
  const filtered = appData.inventory.filter(i =>
    i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
  );
  renderFilteredInventory(filtered);
});

function renderFilteredInventory(items) {
  document.getElementById('inventory-table').innerHTML = items.map(item => {
    let status, statusClass;
    if (item.qty <= 0) {
      status = 'Out of Stock'; statusClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    } else if (item.qty <= item.reorder) {
      status = 'Low Stock'; statusClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    } else {
      status = 'In Stock'; statusClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">${escHtml(item.name)}</td>
        <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">${escHtml(item.sku)}</td>
        <td class="px-6 py-4 text-slate-500 dark:text-slate-400">${escHtml(item.category)}</td>
        <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${item.qty.toLocaleString()} ${escHtml(item.unit || 'No')}</td>
        <td class="px-6 py-4"><span class="py-1 px-2.5 rounded-full text-xs font-semibold ${statusClass}">${status}</span></td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button onclick="openModal('edit', ${item.id})" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-base">edit</span></button>
            <button onclick="deleteItem(${item.id})" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-base">delete</span></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- THEME ---

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  document.getElementById('theme-icon').textContent = isDark ? 'dark_mode' : 'light_mode';
  const headerIcon = document.getElementById('header-theme-icon');
  if (headerIcon) headerIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

// --- MOBILE MENU ---

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// --- TOAST ---

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-msg');
  msgEl.textContent = msg;
  icon.textContent = type === 'delete' ? 'delete' : 'check_circle';
  toast.classList.remove('hidden', 'hide');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.classList.remove('show', 'hide');
      toast.classList.add('hidden');
    }, 300);
  }, 2500);
}

// --- UTILS ---

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// --- TEAM MEMBER MODAL ---

function showTeamMemberModal(jsonStr, color) {
  const m = JSON.parse(jsonStr);
  const initials = m.name ? m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  const overlay = document.getElementById('team-modal-overlay');
  overlay.innerHTML = `
    <div class="bg-white dark:bg-[#1c2631] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden" onclick="event.stopPropagation()">
      <!-- Header with gradient -->
      <div class="relative bg-gradient-to-r ${color.replace('from-primary', 'from-[#137fec]')} px-6 pt-6 pb-14">
        <button onclick="closeTeamModal()" class="absolute top-4 right-4 text-white/70 hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <!-- Avatar -->
      <div class="relative z-10 flex flex-col items-center -mt-10 mb-2">
        <div class="size-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-[#1c2631] shadow-lg">
          ${initials}
        </div>
        <h3 class="text-lg font-bold text-slate-800 dark:text-white mt-3">${escHtml(m.name || 'Unknown')}</h3>
        <span class="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">${escHtml(m.role || 'Staff')}</span>
      </div>
      <!-- Details -->
      <div class="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 mt-4">
        <div class="bg-white dark:bg-[#1c2631] p-4 flex flex-col gap-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Employee ID</span>
          <p class="text-sm font-semibold text-slate-800 dark:text-white font-mono">${escHtml(m.emp_id || '--')}</p>
        </div>
        <div class="bg-white dark:bg-[#1c2631] p-4 flex flex-col gap-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location</span>
          <p class="text-sm font-semibold text-slate-800 dark:text-white">${escHtml(m.location || '--')}</p>
        </div>
        <div class="bg-white dark:bg-[#1c2631] p-4 flex flex-col gap-1 col-span-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Mobile</span>
          <p class="text-sm font-semibold text-slate-800 dark:text-white">${m.mobile ? `<a href="tel:${escHtml(m.mobile)}" class="text-primary hover:underline">${escHtml(m.mobile)}</a>` : '--'}</p>
        </div>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function closeTeamModal() {
  document.getElementById('team-modal-overlay').classList.add('hidden');
}

// --- EXPORT TO EXCEL ---

function exportInventoryToExcel() {
  const rows = appData.inventory.map(item => ({
    'Item Name': item.name,
    'HSN Code': item.sku,
    'Category': item.category,
    'Quantity': item.qty,
    'Unit': item.unit || 'No',
    'Rate (Excl. Tax)': item.rate || '',
    'GST %': item.gst || '',
    'Reorder Level': item.reorder,
    'Status': item.qty <= 0 ? 'Out of Stock' : item.qty <= item.reorder ? 'Low Stock' : 'In Stock',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, 'Inventory_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  showToast('Excel file downloaded');
}

function exportReportsToExcel() {
  const txns = appData.transactions;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayTxns = txns.filter(t => t.date.slice(0, 10) === todayStr);
  const mtdTxns = txns.filter(t => new Date(t.date) >= monthStart);

  // Sheet 1: Today's transactions
  const todayRows = todayTxns.map(t => ({
    'Item': t.itemName,
    'HSN Code': t.sku,
    'Type': t.type === 'in' ? 'Stock In' : 'Stock Out',
    'Quantity': t.qty,
    'Date & Time': formatDate(t.date),
    'User': t.user,
  }));

  // Sheet 2: MTD transactions
  const mtdRows = mtdTxns.map(t => ({
    'Item': t.itemName,
    'HSN Code': t.sku,
    'Type': t.type === 'in' ? 'Stock In' : 'Stock Out',
    'Quantity': t.qty,
    'Date & Time': formatDate(t.date),
    'User': t.user,
  }));

  // Sheet 3: Summary
  const todayIn = todayTxns.filter(t => t.type === 'in').reduce((s, t) => s + t.qty, 0);
  const todayOut = todayTxns.filter(t => t.type === 'out').reduce((s, t) => s + t.qty, 0);
  const mtdIn = mtdTxns.filter(t => t.type === 'in').reduce((s, t) => s + t.qty, 0);
  const mtdOut = mtdTxns.filter(t => t.type === 'out').reduce((s, t) => s + t.qty, 0);
  const closingStock = appData.inventory.reduce((s, i) => s + i.qty, 0);
  const lowStock = appData.inventory.filter(i => i.qty <= i.reorder).length;

  const summaryRows = [
    { 'Metric': 'Today - Total Transactions', 'Value': todayTxns.length },
    { 'Metric': 'Today - Stock In (qty)', 'Value': todayIn },
    { 'Metric': 'Today - Stock Out (qty)', 'Value': todayOut },
    { 'Metric': 'Today - Net Movement', 'Value': todayIn - todayOut },
    { 'Metric': 'MTD - Total Transactions', 'Value': mtdTxns.length },
    { 'Metric': 'MTD - Stock In (qty)', 'Value': mtdIn },
    { 'Metric': 'MTD - Stock Out (qty)', 'Value': mtdOut },
    { 'Metric': 'MTD - Net Movement', 'Value': mtdIn - mtdOut },
    { 'Metric': 'Closing Stock', 'Value': closingStock },
    { 'Metric': 'Low Stock Items', 'Value': lowStock },
  ];

  const wb = XLSX.utils.book_new();
  const colWidths = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const wsToday = XLSX.utils.json_to_sheet(todayRows.length ? todayRows : [{ 'Item': 'No transactions today' }]);
  wsToday['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsToday, 'Today');

  const wsMtd = XLSX.utils.json_to_sheet(mtdRows.length ? mtdRows : [{ 'Item': 'No transactions this month' }]);
  wsMtd['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsMtd, 'Month to Date');

  XLSX.writeFile(wb, 'Reports_' + todayStr + '.xlsx');
  showToast('Reports Excel downloaded');
}

// --- NEW ENTRY PAGE ---

function renderNewEntryPage() {
  renderCategoryTabs();
  renderEntryCards();
  updateBottomBar();
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const count = cat === 'All'
      ? appData.inventory.length
      : appData.inventory.filter(i => i.category === cat).length;
    const isActive = activeCategory === cat;
    return `
      <button onclick="filterCategory('${cat}')"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors
          ${isActive
            ? 'bg-primary text-white shadow-sm'
            : 'bg-white dark:bg-[#1c2631] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }">
        ${escHtml(cat)}
        <span class="text-xs ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} px-1.5 py-0.5 rounded-full">${count}</span>
      </button>
    `;
  }).join('');
}

function renderEntryCards() {
  const container = document.getElementById('entry-cards-grid');
  if (!container) return;

  const items = activeCategory === 'All'
    ? appData.inventory
    : appData.inventory.filter(i => i.category === activeCategory);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
        <span class="material-symbols-outlined text-5xl mb-3">inventory_2</span>
        <p class="text-sm font-medium">No items in this category</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const qty = entryCart[item.id] || 0;
    const isSelected = qty > 0;
    const isOutOfStock = item.qty <= 0;
    const isLowStock = item.qty > 0 && item.qty <= item.reorder;
    const isDisabled = entryType === 'out' && isOutOfStock;
    const rate = item.rate || 0;
    const gst = item.gst || 0;

    let stockBadge = '';
    if (isOutOfStock) {
      stockBadge = '<span class="stock-warning inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">Out of Stock</span>';
    } else if (isLowStock) {
      stockBadge = '<span class="stock-warning inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">Low Stock</span>';
    }

    return `
      <div class="entry-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}
        bg-white dark:bg-[#1c2631] rounded-xl border-2 ${isSelected ? 'border-primary' : 'border-slate-200 dark:border-slate-800'} p-5 cursor-pointer"
        data-item-id="${item.id}">

        <!-- Header: Name + Stock Badge -->
        <div class="flex items-start justify-between mb-3">
          <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-slate-800 dark:text-white text-sm truncate">${escHtml(item.name)}</h4>
            <p class="text-xs text-slate-400 font-mono mt-0.5">HSN: ${escHtml(item.sku)}</p>
          </div>
          ${stockBadge}
        </div>

        <!-- Stock Level -->
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-sm text-slate-400">inventory</span>
          <span class="text-sm text-slate-600 dark:text-slate-400">Stock: <strong class="text-slate-800 dark:text-white">${item.qty} ${escHtml(item.unit || 'No')}</strong></span>
        </div>

        <!-- Rate + GST -->
        <div class="flex items-center gap-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
          <span class="material-symbols-outlined text-sm">currency_rupee</span>
          <span>${rate.toFixed(2)} + ${gst}% GST</span>
        </div>

        <!-- Quantity Controls -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">${entryType === 'in' ? 'Add Qty' : 'Remove Qty'}</span>
          <div class="flex items-center gap-3">
            <button onclick="event.stopPropagation(); updateEntryQty(${item.id}, -1)"
              class="size-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-lg font-bold ${qty <= 0 ? 'opacity-40 pointer-events-none' : ''}">
              &minus;
            </button>
            <span id="qty-display-${item.id}" class="qty-display text-lg font-bold text-slate-800 dark:text-white w-8 text-center">${qty}</span>
            <button onclick="event.stopPropagation(); updateEntryQty(${item.id}, 1)"
              class="size-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-lg font-bold ${isDisabled ? 'opacity-40 pointer-events-none' : ''}">
              +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategoryTabs();
  renderEntryCards();
}

function setEntryType(type) {
  entryType = type;
  entryCart = {};

  // Update toggle UI
  const inBtn = document.getElementById('entry-type-in');
  const outBtn = document.getElementById('entry-type-out');
  if (type === 'in') {
    inBtn.className = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-green-500 text-white';
    outBtn.className = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors text-slate-500 dark:text-slate-400';
  } else {
    inBtn.className = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors text-slate-500 dark:text-slate-400';
    outBtn.className = 'px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-red-500 text-white';
  }

  renderEntryCards();
  updateBottomBar();
}

function updateEntryQty(itemId, delta) {
  const item = appData.inventory.find(i => i.id === itemId);
  if (!item) return;

  const current = entryCart[itemId] || 0;
  let newQty = current + delta;

  // Bounds checking
  if (newQty < 0) newQty = 0;
  if (entryType === 'out' && newQty > item.qty) newQty = item.qty;

  if (newQty === 0) {
    delete entryCart[itemId];
  } else {
    entryCart[itemId] = newQty;
  }

  // Bump animation on the qty display
  const display = document.getElementById('qty-display-' + itemId);
  if (display) {
    display.textContent = newQty;
    display.classList.remove('bump');
    void display.offsetWidth; // force reflow
    display.classList.add('bump');
  }

  // Update card selection visual
  const card = document.querySelector(`.entry-card[data-item-id="${itemId}"]`);
  if (card) {
    if (newQty > 0) {
      card.classList.add('selected');
      card.classList.remove('border-slate-200', 'dark:border-slate-800');
      card.classList.add('border-primary');
    } else {
      card.classList.remove('selected', 'border-primary');
      card.classList.add('border-slate-200', 'dark:border-slate-800');
    }
  }

  // Update minus button opacity
  const minusBtn = card?.querySelector('button');
  if (minusBtn) {
    if (newQty <= 0) {
      minusBtn.classList.add('opacity-40', 'pointer-events-none');
    } else {
      minusBtn.classList.remove('opacity-40', 'pointer-events-none');
    }
  }

  updateBottomBar();
}

function updateBottomBar() {
  const bar = document.getElementById('entry-bottom-bar');
  const countEl = document.getElementById('entry-bar-count');
  if (!bar || !countEl) return;

  const selectedCount = Object.keys(entryCart).length;
  const totalQty = Object.values(entryCart).reduce((s, q) => s + q, 0);

  if (selectedCount > 0) {
    bar.classList.add('visible');
    countEl.textContent = `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected (${totalQty} units)`;
  } else {
    bar.classList.remove('visible');
  }
}

function clearEntryCart() {
  entryCart = {};
  renderEntryCards();
  updateBottomBar();
}

async function confirmEntry() {
  const itemIds = Object.keys(entryCart);
  if (itemIds.length === 0) {
    showToast('No items selected', 'delete');
    return;
  }

  const now = new Date().toISOString();
  const user = currentEmployee ? currentEmployee.name : 'Unknown';
  let maxTxnId = appData.transactions.length > 0
    ? Math.max(...appData.transactions.map(t => t.id))
    : 0;

  const supabaseRows = [];

  itemIds.forEach(idStr => {
    const itemId = parseInt(idStr, 10);
    const qty = entryCart[itemId];
    const item = appData.inventory.find(i => i.id === itemId);
    if (!item || !qty) return;

    // Update inventory quantity
    if (entryType === 'in') {
      item.qty += qty;
    } else {
      item.qty = Math.max(0, item.qty - qty);
    }

    // Create local transaction
    maxTxnId++;
    appData.transactions.push({
      id: maxTxnId,
      itemName: item.name,
      sku: item.sku,
      type: entryType,
      qty: qty,
      date: now,
      user: user,
    });

    // Prepare Supabase row
    supabaseRows.push({
      item_name: item.name,
      hsn_code: item.sku,
      category: item.category,
      entry_type: entryType,
      quantity: qty,
      unit: item.unit || 'No',
      rate: item.rate || null,
      gst: item.gst || null,
      employee_id: currentEmployee ? currentEmployee.id : null,
      emp_name: user,
      location: selectedLocation || null,
      created_at: now,
    });

    // Low stock notification
    if (item.qty <= item.reorder) {
      const existingNotif = appData.notifications.find(n => n.text.includes(item.name));
      if (!existingNotif) {
        appData.notifications.push({
          id: Date.now() + itemId,
          text: `${item.name} stock ${item.qty <= 0 ? 'depleted' : 'critically low'} (${item.qty} ${item.unit || 'units'})`,
          type: 'alert',
          time: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        });
      }
    }
  });

  saveData(appData);

  // Save to Supabase via REST
  if (supabaseRows.length > 0) {
    try {
      await supabaseInsert('stock_entries', supabaseRows);
    } catch (err) {
      console.error('Supabase save error:', err);
      showToast('Saved locally. Cloud sync failed.', 'delete');
    }
  }

  entryCart = {};

  const typeLabel = entryType === 'in' ? 'Stock In' : 'Stock Out';
  showToast(`${typeLabel} recorded for ${itemIds.length} item${itemIds.length !== 1 ? 's' : ''}`);

  // Reload fresh data from Supabase to stay in sync
  await loadFromSupabase();
  saveData(appData);

  navigateTo('transactions');
}

// --- INIT ---

// Check if already logged in
if (checkSession()) {
  // Always load fresh data from Supabase, then render
  loadFromSupabase().then(() => {
    saveData(appData);
    renderDashboard();
  });
}
// Otherwise login screen is shown, renderDashboard called after loginConfirm()
