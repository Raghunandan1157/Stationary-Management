// ============================================================
// Stationary Management App - StockRegister
// All data persisted in localStorage
// ============================================================

// --- DATA LAYER ---

const STORAGE_KEY = 'stockregister_data';

const DEFAULT_TEAM = [
  { id: 1, name: 'Alex Johnson', role: 'Inventory Manager', initials: 'AJ', color: 'from-primary to-blue-400' },
  { id: 2, name: 'Priya Sharma', role: 'Stock Controller', initials: 'PS', color: 'from-emerald-500 to-teal-400' },
  { id: 3, name: 'Ravi Kumar', role: 'Procurement Lead', initials: 'RK', color: 'from-violet-500 to-purple-400' },
  { id: 4, name: 'Sneha Reddy', role: 'Data Analyst', initials: 'SR', color: 'from-amber-500 to-orange-400' },
  { id: 5, name: 'Mohammed Irfan', role: 'Warehouse Staff', initials: 'MI', color: 'from-rose-500 to-pink-400' },
  { id: 6, name: 'Divya Nair', role: 'Accounts Officer', initials: 'DN', color: 'from-cyan-500 to-sky-400' },
];

const DEFAULT_INVENTORY = [
  { id: 1, name: 'Ball Pen (Blue)', sku: 'WRT-BP-001', category: 'Writing', qty: 2500, reorder: 500 },
  { id: 2, name: 'Gel Pen (Black)', sku: 'WRT-GP-002', category: 'Writing', qty: 1800, reorder: 400 },
  { id: 3, name: 'A4 Copier Paper (500 sheets)', sku: 'PAP-A4-001', category: 'Paper', qty: 320, reorder: 100 },
  { id: 4, name: 'Legal Size Paper', sku: 'PAP-LG-002', category: 'Paper', qty: 150, reorder: 50 },
  { id: 5, name: 'Box File', sku: 'FIL-BX-001', category: 'Filing', qty: 85, reorder: 30 },
  { id: 6, name: 'L-Folder (Transparent)', sku: 'FIL-LF-002', category: 'Filing', qty: 600, reorder: 200 },
  { id: 7, name: 'Stapler (Heavy Duty)', sku: 'DSK-ST-001', category: 'Desk Supplies', qty: 45, reorder: 15 },
  { id: 8, name: 'Stapler Pins (No.10)', sku: 'DSK-SP-002', category: 'Desk Supplies', qty: 3200, reorder: 500 },
  { id: 9, name: 'Whiteboard Marker', sku: 'WRT-WM-003', category: 'Writing', qty: 12, reorder: 50 },
  { id: 10, name: 'Printer Toner (Black)', sku: 'PRT-TN-001', category: 'Printing', qty: 8, reorder: 10 },
  { id: 11, name: 'Sticky Notes (3x3)', sku: 'DSK-SN-003', category: 'Desk Supplies', qty: 15, reorder: 40 },
  { id: 12, name: 'USB Flash Drive 32GB', sku: 'TEC-USB-001', category: 'Tech Accessories', qty: 5, reorder: 10 },
  { id: 13, name: 'Scissors (Office)', sku: 'DSK-SC-004', category: 'Desk Supplies', qty: 22, reorder: 10 },
  { id: 14, name: 'Envelope (A4 Brown)', sku: 'PAP-ENV-003', category: 'Paper', qty: 900, reorder: 200 },
  { id: 15, name: 'Correction Pen', sku: 'WRT-CP-004', category: 'Writing', qty: 3, reorder: 20 },
];

const DEFAULT_TRANSACTIONS = [
  { id: 1, itemName: 'Ball Pen (Blue)', sku: 'WRT-BP-001', type: 'in', qty: 500, date: '2026-02-17T10:30:00', user: 'P. Sharma' },
  { id: 2, itemName: 'A4 Copier Paper', sku: 'PAP-A4-001', type: 'out', qty: 80, date: '2026-02-17T09:15:00', user: 'R. Kumar' },
  { id: 3, itemName: 'Printer Toner (Black)', sku: 'PRT-TN-001', type: 'out', qty: 2, date: '2026-02-16T16:45:00', user: 'M. Irfan' },
  { id: 4, itemName: 'Gel Pen (Black)', sku: 'WRT-GP-002', type: 'in', qty: 200, date: '2026-02-16T14:00:00', user: 'P. Sharma' },
  { id: 5, itemName: 'L-Folder (Transparent)', sku: 'FIL-LF-002', type: 'in', qty: 300, date: '2026-02-16T11:30:00', user: 'A. Johnson' },
  { id: 6, itemName: 'Stapler Pins (No.10)', sku: 'DSK-SP-002', type: 'out', qty: 500, date: '2026-02-15T15:20:00', user: 'D. Nair' },
  { id: 7, itemName: 'USB Flash Drive 32GB', sku: 'TEC-USB-001', type: 'out', qty: 3, date: '2026-02-15T12:00:00', user: 'S. Reddy' },
  { id: 8, itemName: 'Whiteboard Marker', sku: 'WRT-WM-003', type: 'in', qty: 50, date: '2026-02-15T10:00:00', user: 'R. Kumar' },
];

const DEFAULT_SUPPLIERS = [
  { id: 1, name: 'Classmate Stationery', contact: 'Vikram Patel', phone: '+91 98765 43210', items: 'Writing, Paper', status: 'active' },
  { id: 2, name: 'Hindustan Office Supplies', contact: 'Anita Desai', phone: '+91 87654 32109', items: 'Filing, Desk Supplies', status: 'active' },
  { id: 3, name: 'TechMart Peripherals', contact: 'Suresh Menon', phone: '+91 76543 21098', items: 'Tech Accessories, Printing', status: 'active' },
  { id: 4, name: 'Paper World India', contact: 'Farhan Qureshi', phone: '+91 65432 10987', items: 'Paper, Printing', status: 'inactive' },
];

const DEFAULT_NOTIFICATIONS = [
  { id: 1, text: 'Correction Pen stock critically low (3 units)', type: 'alert', time: '5 min ago' },
  { id: 2, text: 'USB Flash Drive 32GB below reorder level', type: 'alert', time: '1 hr ago' },
  { id: 3, text: 'New stock received: Ball Pen (Blue) +500', type: 'info', time: '2 hrs ago' },
];

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const data = {
    inventory: DEFAULT_INVENTORY,
    transactions: DEFAULT_TRANSACTIONS,
    team: DEFAULT_TEAM,
    suppliers: DEFAULT_SUPPLIERS,
    notifications: DEFAULT_NOTIFICATIONS,
    profile: {
      branch: 'Central Warehouse - Bangalore',
      boe: 'BOE-KA-2024-0142',
    },
  };
  saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let appData = loadData();

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

  // Team grid
  document.getElementById('team-grid').innerHTML = appData.team.map(m => `
    <div class="bg-white dark:bg-[#1c2631] p-6 flex items-center gap-4">
      <div class="size-12 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${m.initials}</div>
      <div class="min-w-0">
        <p class="font-semibold text-slate-800 dark:text-white truncate">${escHtml(m.name)}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">${escHtml(m.role)}</p>
      </div>
    </div>
  `).join('');

  // Sidebar team avatars
  document.getElementById('team-avatars').innerHTML = appData.team.map(m => `
    <div class="size-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-[#161e27]" title="${escHtml(m.name)}">${m.initials}</div>
  `).join('');
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
        <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${item.qty.toLocaleString()}</td>
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
  navigateTo('inventory');
  setTimeout(() => openModal('add'), 100);
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
        <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">${item.qty.toLocaleString()}</td>
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

// --- EXPORT TO EXCEL ---

function exportInventoryToExcel() {
  const rows = appData.inventory.map(item => ({
    'Item Name': item.name,
    'SKU': item.sku,
    'Category': item.category,
    'Quantity': item.qty,
    'Reorder Level': item.reorder,
    'Status': item.qty <= 0 ? 'Out of Stock' : item.qty <= item.reorder ? 'Low Stock' : 'In Stock',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, 'Inventory_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  showToast('Excel file downloaded');
}

// --- INIT ---

renderDashboard();
