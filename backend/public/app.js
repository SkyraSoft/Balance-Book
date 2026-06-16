// Global State
let token = localStorage.getItem('token') || '';
let currentTab = 'dashboard';
let customersList = [];
let transactionsList = [];

// Base API URI (in production this resolves to relative path, locally it points to port 5000)
const API_URL = '';

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// Navigation
const menuLinks = document.querySelectorAll('.menu-link');
const tabSections = document.querySelectorAll('.tab-section');

// Notification banner helpers
const showNotification = (message, type = 'success') => {
  const container = document.getElementById('notification-container') || createNotificationContainer();
  const notif = document.createElement('div');
  notif.className = `badge badge-${type}`;
  notif.style.padding = '12px 20px';
  notif.style.borderRadius = '8px';
  notif.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  notif.style.marginBottom = '10px';
  notif.style.fontSize = '14px';
  notif.style.display = 'flex';
  notif.style.justifyContent = 'space-between';
  notif.style.alignItems = 'center';
  notif.style.gap = '15px';
  notif.style.animation = 'fadeIn 0.2s ease';

  notif.innerHTML = `
    <span>${message}</span>
    <span style="cursor:pointer;font-weight:bold" onclick="this.parentElement.remove()">×</span>
  `;

  container.appendChild(notif);
  setTimeout(() => notif.remove(), 4000);
};

const createNotificationContainer = () => {
  const div = document.createElement('div');
  div.id = 'notification-container';
  div.style.position = 'fixed';
  div.style.top = '20px';
  div.style.right = '20px';
  div.style.zIndex = '9999';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  document.body.appendChild(div);
  return div;
};

// Initial Checks
document.addEventListener('DOMContentLoaded', () => {
  // Theme check
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (token) {
    showApp();
  } else {
    showAuth();
  }

  // Setup Menu Tab Clicks
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = link.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
});

// Authentication Handling
const showAuth = () => {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
};

const showApp = () => {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  
  // Set default profile initials from business settings
  fetchBusinessSettings();
  
  // Load initial tab data
  switchTab(currentTab);
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    token = data.token;
    localStorage.setItem('token', token);
    showNotification('Logged in successfully!');
    showApp();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  token = '';
  localStorage.removeItem('token');
  showNotification('Logged out!');
  showAuth();
});

// View Routing Switcher
const switchTab = (tabName) => {
  currentTab = tabName;
  
  // Toggle links active state
  menuLinks.forEach(link => {
    if (link.getAttribute('data-tab') === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle sections visibility
  tabSections.forEach(section => {
    if (section.id === `${tabName}-tab`) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });

  // Load appropriate data
  if (tabName === 'dashboard') loadDashboardData();
  else if (tabName === 'customers') loadCustomersData();
  else if (tabName === 'transactions') loadTransactionsData();
  else if (tabName === 'tickets') loadTicketsData();
  else if (tabName === 'settings') loadSettingsData();
};

// --- DATA FETCHING & UI RENDERING ---

// Get API Request Helper
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        // Token expired / Invalid -> Log out
        token = '';
        localStorage.removeItem('token');
        showAuth();
      }
      throw new Error(data.message || 'API Request failed');
    }
    return data;
  } catch (error) {
    showNotification(error.message, 'danger');
    throw error;
  }
};

// 1. Dashboard Tab
const loadDashboardData = async () => {
  const data = await apiRequest('/api/admin/dashboard');
  if (!data) return;

  // Render KPIs
  document.getElementById('db-total-customers').innerText = data.totalCustomers;
  document.getElementById('db-total-in').innerText = `₹${data.totalGot.toLocaleString()}`;
  document.getElementById('db-total-out').innerText = `₹${data.totalGave.toLocaleString()}`;
  
  const netText = document.getElementById('db-net-receivables');
  const pendingAmount = Math.abs(data.netReceivables);
  netText.innerText = `₹${pendingAmount.toLocaleString()}`;
  if (data.netReceivables > 0) {
    netText.style.color = 'var(--danger)'; // Customers owe us
    document.getElementById('db-net-label').innerText = "Net Receivable (Pending)";
  } else {
    netText.style.color = 'var(--success)';
    document.getElementById('db-net-label').innerText = "Net Payable (Settled)";
  }

  // Render Recent Activity Logs
  const activityList = document.getElementById('db-recent-activity');
  activityList.innerHTML = '';
  if (data.recentTransactions.length === 0) {
    activityList.innerHTML = '<tr><td colspan="5" style="text-align:center">No recent transactions</td></tr>';
  } else {
    data.recentTransactions.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString();
      const typeBadge = t.type === 'gave' 
        ? '<span class="badge badge-danger">YOU GAVE</span>' 
        : '<span class="badge badge-success">YOU GOT</span>';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong>${t.customerId ? t.customerId.name : 'Unknown'}</strong></td>
        <td>${typeBadge}</td>
        <td><span class="${t.type === 'gave' ? 'red-txt' : 'green-txt'}">₹${t.amount.toLocaleString()}</span></td>
        <td>${t.note || '-'}</td>
      `;
      activityList.appendChild(tr);
    });
  }

  // Render Top Debtors
  const debtorsList = document.getElementById('db-top-debtors');
  debtorsList.innerHTML = '';
  if (data.topDebtors.length === 0) {
    debtorsList.innerHTML = '<li style="list-style:none;color:var(--text-light)">No debtors listed</li>';
  } else {
    data.topDebtors.forEach(d => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.padding = '12px 0';
      li.style.borderBottom = '1px solid var(--border)';
      li.innerHTML = `
        <div>
          <strong>${d.name}</strong>
          <div style="font-size:11px;color:var(--text-light)">${d.phone || 'No phone'}</div>
        </div>
        <span class="red-txt">₹${Math.abs(d.balance).toLocaleString()}</span>
      `;
      debtorsList.appendChild(li);
    });
  }
};

// 2. Customers Tab
const loadCustomersData = async () => {
  const customers = await apiRequest('/api/customers');
  if (!customers) return;
  customersList = customers;

  // Set counter
  document.getElementById('c-count').innerText = `${customers.length} Registered`;

  const tbody = document.getElementById('c-table-body');
  tbody.innerHTML = '';

  customers.forEach(c => {
    const isReceivable = c.balance < 0; // standard ledger schema
    const balAmount = Math.abs(c.balance);
    const balanceCell = c.balance === 0 
      ? '<span>Settled</span>'
      : `<span class="${isReceivable ? 'red-txt' : 'green-txt'}">₹${balAmount.toLocaleString()}</span>`;
    const labelCell = c.balance === 0
      ? '<span class="badge badge-warning">Settled</span>'
      : (isReceivable ? '<span class="badge badge-danger">Gave (Owes Us)</span>' : '<span class="badge badge-success">Got (Paid Us)</span>');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${c.phone || '-'}</td>
      <td><span class="badge badge-secondary">${c.type}</span></td>
      <td>${balanceCell}</td>
      <td>${labelCell}</td>
      <td class="text-right">
        <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="viewCustomerLedger('${c._id}')">Ledger</button>
        <button class="btn btn-danger" style="padding:6px 12px;font-size:12px;margin-left:4px" onclick="deleteCustomer('${c._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// Create customer submit
document.getElementById('add-customer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('c-name').value;
  const phone = document.getElementById('c-phone').value;
  const type = document.getElementById('c-type').value;
  const initialBalance = document.getElementById('c-balance').value;
  const balanceType = document.getElementById('c-bal-type').value;

  const res = await apiRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ name, phone, type, initialBalance, balanceType })
  });

  if (res) {
    showNotification('Customer added successfully!');
    document.getElementById('add-customer-form').reset();
    closeDrawer('add-customer-drawer');
    loadCustomersData();
  }
});

// View Customer Ledger
const viewCustomerLedger = async (id) => {
  const data = await apiRequest(`/api/customers/${id}`);
  if (!data) return;

  const c = data.customer;
  document.getElementById('l-cust-name').innerText = c.name;
  document.getElementById('l-cust-phone').innerText = c.phone || 'No Phone';
  
  const statusEl = document.getElementById('l-cust-status');
  if (c.balance < 0) {
    statusEl.innerHTML = `<span class="red-txt">Pending Due: ₹${Math.abs(c.balance).toLocaleString()}</span>`;
  } else if (c.balance > 0) {
    statusEl.innerHTML = `<span class="green-txt">Advance: ₹${Math.abs(c.balance).toLocaleString()}</span>`;
  } else {
    statusEl.innerHTML = `<span>Settled</span>`;
  }

  // Render transactions
  const tbody = document.getElementById('l-table-body');
  tbody.innerHTML = '';

  data.transactions.forEach(t => {
    const tr = document.createElement('tr');
    const dateStr = new Date(t.date).toLocaleDateString();
    const typeBadge = t.type === 'gave' 
      ? '<span class="badge badge-danger">Gave</span>' 
      : '<span class="badge badge-success">Got</span>';
    
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${typeBadge}</td>
      <td><span class="${t.type === 'gave' ? 'red-txt' : 'green-txt'}">₹${t.amount.toLocaleString()}</span></td>
      <td>${t.note || '-'}</td>
    `;
    tbody.appendChild(tr);
  });

  openDrawer('ledger-drawer');
};

const deleteCustomer = async (id) => {
  if (confirm("Are you sure you want to delete this customer? This will clear all ledger transaction records permanently.")) {
    const data = await apiRequest(`/api/customers/${id}`, { method: 'DELETE' });
    if (data) {
      showNotification('Customer removed!');
      loadCustomersData();
    }
  }
};

// 3. Transactions Tab
const loadTransactionsData = async () => {
  const transactions = await apiRequest('/api/transactions');
  if (!transactions) return;
  transactionsList = transactions;

  // Render search filters dropdowns
  const custSelect = document.getElementById('tx-filter-customer');
  custSelect.innerHTML = '<option value="">All Customers</option>';
  
  // unique customers list sorted
  const uniqueCustomers = [];
  const map = new Map();
  transactions.forEach(t => {
    if (t.customerId && !map.has(t.customerId._id)) {
      map.set(t.customerId._id, true);
      uniqueCustomers.push(t.customerId);
    }
  });

  uniqueCustomers.forEach(c => {
    custSelect.innerHTML += `<option value="${c._id}">${c.name}</option>`;
  });

  renderTransactionsTable(transactions);
};

const renderTransactionsTable = (list) => {
  const tbody = document.getElementById('tx-table-body');
  tbody.innerHTML = '';

  list.forEach(t => {
    const tr = document.createElement('tr');
    const dateStr = new Date(t.date).toLocaleDateString();
    const typeBadge = t.type === 'gave' 
      ? '<span class="badge badge-danger">YOU GAVE</span>' 
      : '<span class="badge badge-success">YOU GOT</span>';
    
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td><strong>${t.customerId ? t.customerId.name : 'Deleted Customer'}</strong></td>
      <td>${typeBadge}</td>
      <td><span class="${t.type === 'gave' ? 'red-txt' : 'green-txt'}">₹${t.amount.toLocaleString()}</span></td>
      <td>${t.note || '-'}</td>
      <td class="text-right">
        <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="deleteTransaction('${t._id}')">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// Filter Transactions Action
const filterTransactions = () => {
  const custId = document.getElementById('tx-filter-customer').value;
  const type = document.getElementById('tx-filter-type').value;

  let filtered = [...transactionsList];

  if (custId) {
    filtered = filtered.filter(t => t.customerId && t.customerId._id === custId);
  }

  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }

  renderTransactionsTable(filtered);
};

// Handle create new transaction (Quick entry)
const setupTxCustomerSelect = async () => {
  const select = document.getElementById('tx-customer-select');
  select.innerHTML = '<option value="">Choose Customer...</option>';
  
  const customers = await apiRequest('/api/customers');
  if (customers) {
    customers.forEach(c => {
      select.innerHTML += `<option value="${c._id}">${c.name} (Balance: ₹${c.balance})</option>`;
    });
  }
};

document.getElementById('add-tx-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const customerId = document.getElementById('tx-customer-select').value;
  const amount = document.getElementById('tx-amount').value;
  const type = document.getElementById('tx-type').value;
  const note = document.getElementById('tx-note').value;
  const date = document.getElementById('tx-date').value;

  const res = await apiRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({ customerId, amount, type, note, date })
  });

  if (res) {
    showNotification('Transaction added successfully!');
    document.getElementById('add-tx-form').reset();
    closeDrawer('add-tx-drawer');
    loadTransactionsData();
  }
});

const deleteTransaction = async (id) => {
  if (confirm("Are you sure you want to delete this ledger entry?")) {
    const data = await apiRequest(`/api/transactions/${id}`, { method: 'DELETE' });
    if (data) {
      showNotification('Entry removed!');
      loadTransactionsData();
    }
  }
};

// 4. Support Tickets Tab
const loadTicketsData = async () => {
  const tickets = await apiRequest('/api/tickets');
  if (!tickets) return;

  const container = document.getElementById('tickets-list');
  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);text-align:center">No support queries received.</p>';
    return;
  }

  tickets.forEach(t => {
    const dateStr = new Date(t.createdAt).toLocaleString();
    const div = document.createElement('div');
    div.className = 'ticket-item';
    
    const statusAction = t.status === 'open' 
      ? `<button class="btn" style="width:auto;padding:6px 12px;font-size:11px" onclick="resolveTicket('${t._id}')">Resolve Ticket</button>`
      : '<span style="color:var(--success);font-weight:bold;font-size:12px">✓ Resolved</span>';
    
    div.innerHTML = `
      <div class="ticket-meta">
        <span class="ticket-category">${t.category} Ticket</span>
        <span class="ticket-date">${dateStr}</span>
      </div>
      <p class="ticket-msg">"${t.message}"</p>
      <div style="display:flex;justify-content:flex-end;margin-top:5px">
        ${statusAction}
      </div>
    `;
    container.appendChild(div);
  });
};

const resolveTicket = async (id) => {
  const res = await apiRequest(`/api/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'resolved' })
  });

  if (res) {
    showNotification('Ticket marked as resolved!');
    loadTicketsData();
  }
};

// 5. Settings Tab
const loadSettingsData = async () => {
  const s = await apiRequest('/api/settings');
  if (!s) return;

  document.getElementById('s-biz-name').value = s.businessName;
  document.getElementById('s-biz-phone').value = s.businessPhone;
  document.getElementById('s-biz-addr').value = s.businessAddress;
  document.getElementById('s-reminders').checked = s.paymentReminders;
  document.getElementById('s-daily').checked = s.dailySummary;
  document.getElementById('s-sms').checked = s.smsAlerts;
  document.getElementById('s-updates').checked = s.appUpdates;
  document.getElementById('s-freq').value = s.reminderFrequency;
};

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const businessName = document.getElementById('s-biz-name').value;
  const businessPhone = document.getElementById('s-biz-phone').value;
  const businessAddress = document.getElementById('s-biz-addr').value;
  const paymentReminders = document.getElementById('s-reminders').checked;
  const dailySummary = document.getElementById('s-daily').checked;
  const smsAlerts = document.getElementById('s-sms').checked;
  const appUpdates = document.getElementById('s-updates').checked;
  const reminderFrequency = document.getElementById('s-freq').value;

  const res = await apiRequest('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      businessName,
      businessPhone,
      businessAddress,
      paymentReminders,
      dailySummary,
      smsAlerts,
      appUpdates,
      reminderFrequency
    })
  });

  if (res) {
    showNotification('Business settings updated!');
    fetchBusinessSettings(); // refresh sidebar/profile initials
  }
});

// Update sidebar banner
const fetchBusinessSettings = async () => {
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    const s = await res.json();
    if (res.ok && s) {
      document.getElementById('store-name-title').innerText = s.businessName;
      // Get initials
      const words = s.businessName.split(' ');
      const initials = words.length > 1 
        ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase() 
        : s.businessName.substring(0, 2).toUpperCase();
      document.getElementById('store-avatar').innerText = initials;
    }
  } catch (error) {
    console.error('Error fetching settings for header:', error);
  }
};

// --- Drawer control helpers ---
const openDrawer = (id) => {
  const overlay = document.getElementById('overlay');
  const drawer = document.getElementById(id);
  
  overlay.style.display = 'block';
  setTimeout(() => {
    drawer.classList.add('open');
  }, 10);

  if (id === 'add-tx-drawer') {
    setupTxCustomerSelect();
  }
};

const closeDrawer = (id) => {
  const drawer = document.getElementById(id);
  drawer.classList.remove('open');
  setTimeout(() => {
    document.getElementById('overlay').style.display = 'none';
  }, 300);
};

// Handle closing active drawers on overlay click
document.getElementById('overlay').addEventListener('click', () => {
  const openDrawers = document.querySelectorAll('.drawer.open');
  openDrawers.forEach(drawer => closeDrawer(drawer.id));
});

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
