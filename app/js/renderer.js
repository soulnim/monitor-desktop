// renderer.js - Frontend Logic for Monitor Desktop App

// ========================================
// Global State
// ========================================
let currentUser = null;
let currentView = 'overview';
let allTransactions = [];
let allTasks = [];
let allBills = [];
let allGoals = [];
let allNotes = [];
let allEvents = [];
let categories = [];

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
 // Check if user is logged in
 const userStr = sessionStorage.getItem('currentUser');
 if (!userStr) {
  window.location.href = 'index.html';
  return;
 }

 currentUser = JSON.parse(userStr);

 // Update user name in sidebar
 document.getElementById('user-name').textContent = `Welcome, ${currentUser.fullName || currentUser.username}`;

 // Load categories
 await loadCategories();

 // Load all data
 await refreshAllData();

 // Set up event listeners
 setupEventListeners();

 // Update current date
 updateCurrentDate();

 // Show overview by default
 showView('overview');
});

// ========================================
// Event Listeners Setup
// ========================================
function setupEventListeners() {
 // Navigation links
 document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
   e.preventDefault();
   const view = link.getAttribute('data-view');
   showView(view);
  });
 });

 // Logout button
 document.getElementById('logout-btn').addEventListener('click', logout);

 // Add buttons
 document.getElementById('add-transaction-btn')?.addEventListener('click', () => openTransactionModal());
 document.getElementById('add-task-btn')?.addEventListener('click', () => openTaskModal());
 document.getElementById('add-bill-btn')?.addEventListener('click', () => openBillModal());
 document.getElementById('add-goal-btn')?.addEventListener('click', () => openGoalModal());
 document.getElementById('add-note-btn')?.addEventListener('click', () => openNoteModal());
 document.getElementById('add-event-btn')?.addEventListener('click', () => openEventModal());

 // Filters
 document.getElementById('transaction-filter')?.addEventListener('change', renderTransactions);
 document.getElementById('task-filter')?.addEventListener('change', renderTasks);
 document.getElementById('bill-filter')?.addEventListener('change', renderBills);

 // Search
 document.getElementById('note-search')?.addEventListener('input', handleNoteSearch);

 // Settings forms
 document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
 document.getElementById('password-form')?.addEventListener('submit', handlePasswordChange);
}

// ========================================
// Navigation
// ========================================
function showView(viewName) {
 currentView = viewName;

 // Update active nav link
 document.querySelectorAll('.nav-link').forEach(link => {
  link.classList.remove('active');
  if (link.getAttribute('data-view') === viewName) {
   link.classList.add('active');
  }
 });

 // Update view title
 const titles = {
  overview: 'Dashboard Overview',
  transactions: 'Transactions',
  tasks: 'Tasks',
  bills: 'Bills',
  goals: 'Goals',
  notes: 'Notes',
  calendar: 'Calendar',
  settings: 'Settings'
 };
 document.getElementById('view-title').textContent = titles[viewName] || viewName;

 // Show/hide views
 document.querySelectorAll('.view').forEach(view => {
  view.classList.remove('active');
 });
 document.getElementById(`view-${viewName}`).classList.add('active');

 // Render view content
 switch (viewName) {
  case 'overview':
   renderOverview();
   break;
  case 'transactions':
   renderTransactions();
   break;
  case 'tasks':
   renderTasks();
   break;
  case 'bills':
   renderBills();
   break;
  case 'goals':
   renderGoals();
   break;
  case 'notes':
   renderNotes();
   break;
  case 'calendar':
   renderCalendar();
   break;
  case 'settings':
   loadSettings();
   break;
 }
}

// ========================================
// Data Loading
// ========================================
async function loadCategories() {
 const result = await window.electronAPI.getCategories();
 if (result.success) {
  categories = result.categories;
 }
}

async function refreshAllData() {
 await Promise.all([
  loadTransactions(),
  loadTasks(),
  loadBills(),
  loadGoals(),
  loadNotes(),
  loadEvents()
 ]);
}

async function loadTransactions() {
 const result = await window.electronAPI.getTransactions(currentUser.userId);
 if (result.success) {
  allTransactions = result.transactions;
 }
}

async function loadTasks() {
 const result = await window.electronAPI.getTasks(currentUser.userId);
 if (result.success) {
  allTasks = result.tasks;
 }
}

async function loadBills() {
 const result = await window.electronAPI.getBills(currentUser.userId);
 if (result.success) {
  allBills = result.bills;
 }
}

async function loadGoals() {
 const result = await window.electronAPI.getGoals(currentUser.userId);
 if (result.success) {
  allGoals = result.goals;
 }
}

async function loadNotes() {
 const result = await window.electronAPI.getNotes(currentUser.userId);
 if (result.success) {
  allNotes = result.notes;
 }
}

async function loadEvents() {
 const result = await window.electronAPI.getEvents(currentUser.userId);
 if (result.success) {
  allEvents = result.events;
 }
}

// ========================================
// Overview Rendering
// ========================================
async function renderOverview() {
 // Get current month/year
 const now = new Date();
 const month = now.getMonth() + 1;
 const year = now.getFullYear();

 // Get monthly totals
 const totalsResult = await window.electronAPI.getMonthlyTotals(currentUser.userId, month, year);
 if (totalsResult.success) {
  const { income, expenses, netSavings } = totalsResult.totals;
  document.getElementById('stat-income').textContent = `$${income}`;
  document.getElementById('stat-expense').textContent = `$${expenses}`;
  document.getElementById('stat-savings').textContent = `$${netSavings}`;
 }

 // Pending tasks count
 const pendingTasks = allTasks.filter(t => !t.isCompleted);
 document.getElementById('stat-tasks').textContent = pendingTasks.length;

 // Recent transactions (last 5)
 const recentTransactions = allTransactions.slice(0, 5);
 renderRecentTransactions(recentTransactions);

 // Upcoming bills (next 7 days)
 const upcomingBillsResult = await window.electronAPI.getUpcomingBills(currentUser.userId, 7);
 if (upcomingBillsResult.success) {
  renderUpcomingBills(upcomingBillsResult.bills);
 }

 // Today's tasks
 const todaysTasks = allTasks.filter(t => {
  if (t.isCompleted) return false;
  const dueDate = new Date(t.dueDate);
  const today = new Date();
  return dueDate.toDateString() === today.toDateString();
 });
 renderTodaysTasks(todaysTasks);

 // Active goals (not achieved)
 const activeGoals = allGoals.filter(g => !g.isAchieved).slice(0, 3);
 renderActiveGoals(activeGoals);
}

function renderRecentTransactions(transactions) {
 const container = document.getElementById('recent-transactions');
 if (transactions.length === 0) {
  container.innerHTML = '<p class="empty-state">No transactions yet</p>';
  return;
 }

 container.innerHTML = transactions.map(t => `
        <div class="list-item" style="margin-bottom: 0.5rem; padding: 0.75rem;">
            <div class="list-item-content">
                <div class="list-item-title" style="font-size: 0.95rem;">${t.description || 'Transaction'}</div>
                <div class="list-item-meta" style="font-size: 0.8rem;">${t.categoryName} • ${formatDate(t.transactionDate)}</div>
            </div>
            <div class="${t.transactionType === 'INCOME' ? 'text-success' : 'text-danger'}" style="font-weight: 600;">
                ${t.transactionType === 'INCOME' ? '+' : '-'}$${parseFloat(t.amount).toFixed(2)}
            </div>
        </div>
    `).join('');
}

function renderUpcomingBills(bills) {
 const container = document.getElementById('upcoming-bills');
 if (bills.length === 0) {
  container.innerHTML = '<p class="empty-state">No upcoming bills</p>';
  return;
 }

 container.innerHTML = bills.map(b => `
        <div class="list-item" style="margin-bottom: 0.5rem; padding: 0.75rem;">
            <div class="list-item-content">
                <div class="list-item-title" style="font-size: 0.95rem;">${b.billName}</div>
                <div class="list-item-meta" style="font-size: 0.8rem;">Due: ${formatDate(b.dueDate)}</div>
            </div>
            <div class="text-warning" style="font-weight: 600;">$${parseFloat(b.amount).toFixed(2)}</div>
        </div>
    `).join('');
}

function renderTodaysTasks(tasks) {
 const container = document.getElementById('todays-tasks');
 if (tasks.length === 0) {
  container.innerHTML = '<p class="empty-state">No tasks for today</p>';
  return;
 }

 container.innerHTML = tasks.map(t => `
        <div class="list-item" style="margin-bottom: 0.5rem; padding: 0.75rem;">
            <div class="list-item-content">
                <div class="list-item-title" style="font-size: 0.95rem;">${t.taskTitle}</div>
                <div class="list-item-meta" style="font-size: 0.8rem;">${t.priority || 'Normal'} Priority</div>
            </div>
        </div>
    `).join('');
}

function renderActiveGoals(goals) {
 const container = document.getElementById('active-goals');
 if (goals.length === 0) {
  container.innerHTML = '<p class="empty-state">No active goals</p>';
  return;
 }

 container.innerHTML = goals.map(g => {
  const progress = (g.currentAmount / g.targetAmount) * 100;
  return `
            <div class="list-item" style="margin-bottom: 0.5rem; padding: 0.75rem; flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div class="list-item-title" style="font-size: 0.95rem;">${g.goalTitle}</div>
                    <div style="font-size: 0.85rem;">$${g.currentAmount}/$${g.targetAmount}</div>
                </div>
                <div class="progress-bar" style="width: 100%;">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
 }).join('');
}

// ========================================
// Transactions Rendering
// ========================================
function renderTransactions() {
 const filter = document.getElementById('transaction-filter')?.value || 'all';
 let filtered = allTransactions;

 if (filter !== 'all') {
  filtered = allTransactions.filter(t => t.transactionType === filter);
 }

 const container = document.getElementById('transactions-list');
 if (filtered.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <p>No transactions found</p>
            </div>
        `;
  return;
 }

 container.innerHTML = filtered.map(t => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${t.description || 'Transaction'}</div>
                <div class="list-item-meta">${t.categoryName} • ${formatDate(t.transactionDate)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="${t.transactionType === 'INCOME' ? 'text-success' : 'text-danger'}" style="font-weight: 600; font-size: 1.2rem;">
                    ${t.transactionType === 'INCOME' ? '+' : '-'}$${parseFloat(t.amount).toFixed(2)}
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon" onclick="editTransaction('${t.transactionId}')">✏️</button>
                    <button class="btn-icon danger" onclick="deleteTransaction('${t.transactionId}')">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// Tasks Rendering
// ========================================
function renderTasks() {
 const filter = document.getElementById('task-filter')?.value || 'all';
 let filtered = allTasks;

 if (filter === 'pending') {
  filtered = allTasks.filter(t => !t.isCompleted);
 } else if (filter === 'completed') {
  filtered = allTasks.filter(t => t.isCompleted);
 }

 const container = document.getElementById('tasks-list');
 if (filtered.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>No tasks found</p>
            </div>
        `;
  return;
 }

 container.innerHTML = filtered.map(t => `
        <div class="list-item ${t.isCompleted ? 'completed' : ''}">
            <div class="list-item-content">
                <div class="list-item-title" style="${t.isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.taskTitle}</div>
                <div class="list-item-meta">
                    ${t.description || ''} • Due: ${formatDate(t.dueDate)} • ${t.priority || 'Normal'} Priority
                </div>
            </div>
            <div class="list-item-actions">
                ${!t.isCompleted ? `<button class="btn-icon" onclick="completeTask('${t.taskId}')">✓</button>` : ''}
                <button class="btn-icon" onclick="editTask('${t.taskId}')">✏️</button>
                <button class="btn-icon danger" onclick="deleteTask('${t.taskId}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// Bills Rendering
// ========================================
function renderBills() {
 const filter = document.getElementById('bill-filter')?.value || 'all';
 let filtered = allBills;

 if (filter === 'unpaid') {
  filtered = allBills.filter(b => !b.isPaid);
 } else if (filter === 'paid') {
  filtered = allBills.filter(b => b.isPaid);
 }

 const container = document.getElementById('bills-list');
 if (filtered.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>No bills found</p>
            </div>
        `;
  return;
 }

 container.innerHTML = filtered.map(b => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${b.billName} ${b.isPaid ? '<span class="badge success">Paid</span>' : ''}</div>
                <div class="list-item-meta">Due: ${formatDate(b.dueDate)} • ${b.isRecurring ? 'Recurring' : 'One-time'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="text-warning" style="font-weight: 600; font-size: 1.2rem;">$${parseFloat(b.amount).toFixed(2)}</div>
                <div class="list-item-actions">
                    ${!b.isPaid ? `<button class="btn-icon" onclick="markBillPaid('${b.billId}')">✓</button>` : ''}
                    <button class="btn-icon" onclick="editBill('${b.billId}')">✏️</button>
                    <button class="btn-icon danger" onclick="deleteBill('${b.billId}')">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// Goals Rendering
// ========================================
function renderGoals() {
 const container = document.getElementById('goals-list');
 if (allGoals.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>No goals set yet</p>
            </div>
        `;
  return;
 }

 container.innerHTML = allGoals.map(g => {
  const progress = (g.currentAmount / g.targetAmount) * 100;
  return `
            <div class="list-item" style="flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div class="list-item-title">${g.goalTitle} ${g.isAchieved ? '<span class="badge success">Achieved</span>' : ''}</div>
                    <div class="list-item-actions">
                        ${!g.isAchieved ? `<button class="btn-icon" onclick="markGoalAchieved('${g.goalId}')">✓</button>` : ''}
                        <button class="btn-icon" onclick="editGoal('${g.goalId}')">✏️</button>
                        <button class="btn-icon danger" onclick="deleteGoal('${g.goalId}')">🗑️</button>
                    </div>
                </div>
                <div class="list-item-meta" style="width: 100%; margin-bottom: 0.5rem;">
                    ${g.description || ''} • Target: ${formatDate(g.targetDate)}
                </div>
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span>$${g.currentAmount} / $${g.targetAmount}</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
                <div class="progress-bar" style="width: 100%;">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
 }).join('');
}

// ========================================
// Notes Rendering
// ========================================
function renderNotes() {
 const container = document.getElementById('notes-list');
 if (allNotes.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No notes yet</p>
            </div>
        `;
  return;
 }

 container.innerHTML = allNotes.map(n => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${n.title}</div>
                <div class="list-item-meta">${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}</div>
                <div class="list-item-meta" style="margin-top: 0.25rem;">Updated: ${formatDate(n.updatedAt)}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon" onclick="editNote('${n.noteId}')">✏️</button>
                <button class="btn-icon danger" onclick="deleteNote('${n.noteId}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function handleNoteSearch(e) {
 const keyword = e.target.value.trim();
 if (keyword.length === 0) {
  await loadNotes();
  renderNotes();
  return;
 }

 const result = await window.electronAPI.searchNotes(currentUser.userId, keyword);
 if (result.success) {
  allNotes = result.notes;
  renderNotes();
 }
}

// ========================================
// Calendar Rendering
// ========================================
function renderCalendar() {
 const container = document.getElementById('events-list');
 if (allEvents.length === 0) {
  container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No events scheduled</p>
            </div>
        `;
  return;
 }

 container.innerHTML = allEvents.map(e => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${e.eventTitle}</div>
                <div class="list-item-meta">${e.description || ''} • ${formatDate(e.eventDate)}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon danger" onclick="deleteEvent('${e.eventId}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// Settings
// ========================================
function loadSettings() {
 document.getElementById('settings-fullname').value = currentUser.fullName || '';
 document.getElementById('settings-email').value = currentUser.email || '';
}

async function handleProfileUpdate(e) {
 e.preventDefault();

 const fullName = document.getElementById('settings-fullname').value;
 const email = document.getElementById('settings-email').value;

 const result = await window.electronAPI.updateProfile(currentUser.userId, { fullName, email });

 if (result.success) {
  currentUser.fullName = fullName;
  currentUser.email = email;
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  document.getElementById('user-name').textContent = `Welcome, ${fullName || currentUser.username}`;
  alert('Profile updated successfully!');
 } else {
  alert('Failed to update profile: ' + result.error);
 }
}

async function handlePasswordChange(e) {
 e.preventDefault();

 const oldPassword = document.getElementById('current-password').value;
 const newPassword = document.getElementById('new-password').value;
 const confirmPassword = document.getElementById('confirm-password').value;

 if (newPassword !== confirmPassword) {
  alert('New passwords do not match!');
  return;
 }

 const result = await window.electronAPI.changePassword(currentUser.userId, oldPassword, newPassword);

 if (result.success) {
  alert('Password changed successfully!');
  document.getElementById('password-form').reset();
 } else {
  alert('Failed to change password: ' + result.error);
 }
}

// ========================================
// Modal Functions
// ========================================
function openTransactionModal(transactionId = null) {
 const isEdit = transactionId !== null;
 const transaction = isEdit ? allTransactions.find(t => t.transactionId === transactionId) : null;

 const incomeCategories = categories.filter(c => c.type === 'INCOME');
 const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Add'} Transaction</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="transaction-modal-form">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="modal-transaction-type" required>
                            <option value="EXPENSE" ${transaction?.transactionType === 'EXPENSE' ? 'selected' : ''}>Expense</option>
                            <option value="INCOME" ${transaction?.transactionType === 'INCOME' ? 'selected' : ''}>Income</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="modal-category" required>
                            <optgroup label="Expenses">
                                ${expenseCategories.map(c => `<option value="${c.categoryName}" ${transaction?.categoryName === c.categoryName ? 'selected' : ''}>${c.categoryName}</option>`).join('')}
                            </optgroup>
                            <optgroup label="Income">
                                ${incomeCategories.map(c => `<option value="${c.categoryName}" ${transaction?.categoryName === c.categoryName ? 'selected' : ''}>${c.categoryName}</option>`).join('')}
                            </optgroup>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" step="0.01" id="modal-amount" required value="${transaction?.amount || ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="modal-description" value="${transaction?.description || ''}">
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="modal-date" required value="${transaction ? formatDateInput(transaction.transactionDate) : formatDateInput(new Date())}">
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Transaction</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('transaction-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   transactionType: document.getElementById('modal-transaction-type').value,
   categoryName: document.getElementById('modal-category').value,
   amount: parseFloat(document.getElementById('modal-amount').value),
   description: document.getElementById('modal-description').value,
   transactionDate: new Date(document.getElementById('modal-date').value).toISOString()
  };

  let result;
  if (isEdit) {
   result = await window.electronAPI.updateTransaction(transactionId, data);
  } else {
   result = await window.electronAPI.addTransaction(currentUser.userId, data);
  }

  if (result.success) {
   closeModal();
   await loadTransactions();
   renderTransactions();
   renderOverview();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function openTaskModal(taskId = null) {
 const isEdit = taskId !== null;
 const task = isEdit ? allTasks.find(t => t.taskId === taskId) : null;

 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Add'} Task</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="task-modal-form">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="modal-task-title" required value="${task?.taskTitle || ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="modal-task-description" rows="3">${task?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Due Date</label>
                        <input type="date" id="modal-task-date" required value="${task ? formatDateInput(task.dueDate) : formatDateInput(new Date())}">
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="modal-task-priority">
                            <option value="Low" ${task?.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Normal" ${task?.priority === 'Normal' ? 'selected' : ''}>Normal</option>
                            <option value="High" ${task?.priority === 'High' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Task</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('task-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   taskTitle: document.getElementById('modal-task-title').value,
   description: document.getElementById('modal-task-description').value,
   dueDate: new Date(document.getElementById('modal-task-date').value).toISOString(),
   priority: document.getElementById('modal-task-priority').value
  };

  let result;
  if (isEdit) {
   result = await window.electronAPI.updateTask(taskId, data);
  } else {
   result = await window.electronAPI.addTask(currentUser.userId, data);
  }

  if (result.success) {
   closeModal();
   await loadTasks();
   renderTasks();
   renderOverview();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function openBillModal(billId = null) {
 const isEdit = billId !== null;
 const bill = isEdit ? allBills.find(b => b.billId === billId) : null;

 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Add'} Bill</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="bill-modal-form">
                    <div class="form-group">
                        <label>Bill Name</label>
                        <input type="text" id="modal-bill-name" required value="${bill?.billName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" step="0.01" id="modal-bill-amount" required value="${bill?.amount || ''}">
                    </div>
                    <div class="form-group">
                        <label>Due Date</label>
                        <input type="date" id="modal-bill-date" required value="${bill ? formatDateInput(bill.dueDate) : formatDateInput(new Date())}">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="modal-bill-recurring" ${bill?.isRecurring ? 'checked' : ''}>
                            Recurring Bill
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Bill</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('bill-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   billName: document.getElementById('modal-bill-name').value,
   amount: parseFloat(document.getElementById('modal-bill-amount').value),
   dueDate: new Date(document.getElementById('modal-bill-date').value).toISOString(),
   isRecurring: document.getElementById('modal-bill-recurring').checked
  };

  let result;
  if (isEdit) {
   result = await window.electronAPI.updateBill(billId, data);
  } else {
   result = await window.electronAPI.addBill(currentUser.userId, data);
  }

  if (result.success) {
   closeModal();
   await loadBills();
   renderBills();
   renderOverview();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function openGoalModal(goalId = null) {
 const isEdit = goalId !== null;
 const goal = isEdit ? allGoals.find(g => g.goalId === goalId) : null;

 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Add'} Goal</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="goal-modal-form">
                    <div class="form-group">
                        <label>Goal Title</label>
                        <input type="text" id="modal-goal-title" required value="${goal?.goalTitle || ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="modal-goal-description" rows="3">${goal?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Target Amount</label>
                        <input type="number" step="0.01" id="modal-goal-target" required value="${goal?.targetAmount || ''}">
                    </div>
                    <div class="form-group">
                        <label>Current Amount</label>
                        <input type="number" step="0.01" id="modal-goal-current" value="${goal?.currentAmount || '0'}">
                    </div>
                    <div class="form-group">
                        <label>Target Date</label>
                        <input type="date" id="modal-goal-date" required value="${goal ? formatDateInput(goal.targetDate) : formatDateInput(new Date())}">
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Goal</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('goal-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   goalTitle: document.getElementById('modal-goal-title').value,
   description: document.getElementById('modal-goal-description').value,
   targetAmount: parseFloat(document.getElementById('modal-goal-target').value),
   currentAmount: parseFloat(document.getElementById('modal-goal-current').value),
   targetDate: new Date(document.getElementById('modal-goal-date').value).toISOString()
  };

  let result;
  if (isEdit) {
   result = await window.electronAPI.updateGoal(goalId, data);
  } else {
   result = await window.electronAPI.addGoal(currentUser.userId, data);
  }

  if (result.success) {
   closeModal();
   await loadGoals();
   renderGoals();
   renderOverview();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function openNoteModal(noteId = null) {
 const isEdit = noteId !== null;
 const note = isEdit ? allNotes.find(n => n.noteId === noteId) : null;

 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit' : 'Add'} Note</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="note-modal-form">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="modal-note-title" required value="${note?.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>Content</label>
                        <textarea id="modal-note-content" rows="10" required>${note?.content || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Note</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('note-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   title: document.getElementById('modal-note-title').value,
   content: document.getElementById('modal-note-content').value
  };

  let result;
  if (isEdit) {
   result = await window.electronAPI.updateNote(noteId, data);
  } else {
   result = await window.electronAPI.addNote(currentUser.userId, data);
  }

  if (result.success) {
   closeModal();
   await loadNotes();
   renderNotes();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function openEventModal() {
 const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Add Event</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="event-modal-form">
                    <div class="form-group">
                        <label>Event Title</label>
                        <input type="text" id="modal-event-title" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="modal-event-description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Event Date</label>
                        <input type="date" id="modal-event-date" required value="${formatDateInput(new Date())}">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Event</button>
                </form>
            </div>
        </div>
    `;

 document.getElementById('modal-container').innerHTML = modal;

 document.getElementById('event-modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
   eventTitle: document.getElementById('modal-event-title').value,
   description: document.getElementById('modal-event-description').value,
   eventDate: new Date(document.getElementById('modal-event-date').value).toISOString()
  };

  const result = await window.electronAPI.addEvent(currentUser.userId, data);

  if (result.success) {
   closeModal();
   await loadEvents();
   renderCalendar();
  } else {
   alert('Error: ' + result.error);
  }
 });
}

function closeModal(event) {
 if (event && event.target.className !== 'modal-overlay') return;
 document.getElementById('modal-container').innerHTML = '';
}

// ========================================
// CRUD Operations
// ========================================
async function editTransaction(id) {
 openTransactionModal(id);
}

async function deleteTransaction(id) {
 if (!confirm('Are you sure you want to delete this transaction?')) return;

 const result = await window.electronAPI.deleteTransaction(id);
 if (result.success) {
  await loadTransactions();
  renderTransactions();
  renderOverview();
 }
}

async function editTask(id) {
 openTaskModal(id);
}

async function deleteTask(id) {
 if (!confirm('Are you sure you want to delete this task?')) return;

 const result = await window.electronAPI.deleteTask(id);
 if (result.success) {
  await loadTasks();
  renderTasks();
  renderOverview();
 }
}

async function completeTask(id) {
 const result = await window.electronAPI.completeTask(id);
 if (result.success) {
  await loadTasks();
  renderTasks();
  renderOverview();
 }
}

async function editBill(id) {
 openBillModal(id);
}

async function deleteBill(id) {
 if (!confirm('Are you sure you want to delete this bill?')) return;

 const result = await window.electronAPI.deleteBill(id);
 if (result.success) {
  await loadBills();
  renderBills();
  renderOverview();
 }
}

async function markBillPaid(id) {
 const result = await window.electronAPI.markBillPaid(id);
 if (result.success) {
  await loadBills();
  renderBills();
  renderOverview();
 }
}

async function editGoal(id) {
 openGoalModal(id);
}

async function deleteGoal(id) {
 if (!confirm('Are you sure you want to delete this goal?')) return;

 const result = await window.electronAPI.deleteGoal(id);
 if (result.success) {
  await loadGoals();
  renderGoals();
  renderOverview();
 }
}

async function markGoalAchieved(id) {
 const result = await window.electronAPI.markGoalAchieved(id);
 if (result.success) {
  await loadGoals();
  renderGoals();
  renderOverview();
 }
}

async function editNote(id) {
 openNoteModal(id);
}

async function deleteNote(id) {
 if (!confirm('Are you sure you want to delete this note?')) return;

 const result = await window.electronAPI.deleteNote(id);
 if (result.success) {
  await loadNotes();
  renderNotes();
 }
}

async function deleteEvent(id) {
 if (!confirm('Are you sure you want to delete this event?')) return;

 const result = await window.electronAPI.deleteEvent(id);
 if (result.success) {
  await loadEvents();
  renderCalendar();
 }
}

// ========================================
// Utility Functions
// ========================================
function formatDate(dateString) {
 const date = new Date(dateString);
 return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateInput(dateString) {
 const date = new Date(dateString);
 return date.toISOString().split('T')[0];
}

function updateCurrentDate() {
 const now = new Date();
 const dateStr = now.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
 });
 document.getElementById('current-date').textContent = dateStr;
}

function logout() {
 if (confirm('Are you sure you want to logout?')) {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
 }
}

// Make functions globally available
window.closeModal = closeModal;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.completeTask = completeTask;
window.editBill = editBill;
window.deleteBill = deleteBill;
window.markBillPaid = markBillPaid;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.markGoalAchieved = markGoalAchieved;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.deleteEvent = deleteEvent;