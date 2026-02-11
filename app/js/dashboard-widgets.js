// Dashboard Widgets Manager - Drag and Drop + Customization
let isEditMode = false;
let sortableInstance = null;

// Chart instances
let expenseChartInstance = null;
let trendChartInstance = null;

// Initialize dashboard widgets when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
 console.log('Dashboard Widgets initialized');

 // Check if we're on the overview page
 const overviewView = document.getElementById('view-overview');
 if (!overviewView) {
  console.log('Not on overview page, skipping widget initialization');
  return;
 }

 // Initialize features
 initializeWidgets();
 loadDashboardLayout();
 setupCustomizationListeners();

 // Load and display data
 loadDashboardData();

 // Initialize charts after a short delay to ensure canvas is rendered
 setTimeout(() => {
  initializeCharts();
 }, 100);
});

// Setup customization button listeners
function setupCustomizationListeners() {
 const customizeBtn = document.getElementById('customizeToggleBtn');

 if (!customizeBtn) {
  console.log('Customize button not found');
  return;
 }

 customizeBtn.addEventListener('click', function () {
  toggleEditMode();
 });
}

// Toggle between view mode and edit mode
function toggleEditMode() {
 isEditMode = !isEditMode;

 const panel = document.getElementById('customizationPanel');
 const btn = document.getElementById('customizeToggleBtn');
 const btnText = document.getElementById('customizeBtnText');
 const btnIcon = btn.querySelector('.icon');

 if (isEditMode) {
  // Enter edit mode
  console.log('Entering edit mode');
  panel.classList.add('active');
  document.body.classList.add('edit-mode');
  btn.classList.add('confirm-mode');
  btnText.textContent = 'Save Changes';
  btnIcon.textContent = '✓';

  // Enable drag and drop
  enableDragAndDrop();

  // Load current settings into checkboxes
  loadCurrentSettings();
 } else {
  // Exit edit mode and save
  console.log('Exiting edit mode and saving');
  panel.classList.remove('active');
  document.body.classList.remove('edit-mode');
  btn.classList.remove('confirm-mode');
  btnText.textContent = 'Customize';
  btnIcon.textContent = '⚙️';

  // Disable drag and drop
  disableDragAndDrop();

  // Save the customization
  saveCustomization();
 }
}

// Enable drag and drop functionality
function enableDragAndDrop() {
 const widgetsGrid = document.getElementById('widgetsGrid');

 if (typeof Sortable !== 'undefined' && !sortableInstance) {
  sortableInstance = new Sortable(widgetsGrid, {
   animation: 150,
   ghostClass: 'dragging',
   handle: '.widget-drag-handle',
   onEnd: function () {
    console.log('Widget reordered');
   }
  });
  console.log('Drag and drop enabled');
 } else if (typeof Sortable === 'undefined') {
  console.warn('SortableJS library not loaded');
 }
}

// Disable drag and drop
function disableDragAndDrop() {
 if (sortableInstance) {
  sortableInstance.destroy();
  sortableInstance = null;
  console.log('Drag and drop disabled');
 }
}

// Load current settings into checkboxes
function loadCurrentSettings() {
 const visibleWidgets = getVisibleWidgets();
 const checkboxes = document.querySelectorAll('.widget-toggle input[type="checkbox"]');

 console.log('Loading current settings. Visible widgets:', visibleWidgets);

 checkboxes.forEach(function (checkbox) {
  checkbox.checked = visibleWidgets.includes(checkbox.value);
  updateCheckboxStyle(checkbox);

  // Remove old listeners
  checkbox.removeEventListener('change', handleCheckboxChange);

  // Add change listener to immediately update visibility
  checkbox.addEventListener('change', handleCheckboxChange);
 });
}

// Update checkbox visual style
function updateCheckboxStyle(checkbox) {
 const checkboxItem = checkbox.closest('.widget-toggle');
 if (checkbox.checked) {
  checkboxItem.classList.add('checked');
 } else {
  checkboxItem.classList.remove('checked');
 }
}

// Handle checkbox change - shows/hides widget immediately
function handleCheckboxChange() {
 updateCheckboxStyle(this);
 // Immediately show/hide widget for preview
 const widget = document.querySelector('[data-widget-id="' + this.value + '"]');
 if (widget) {
  widget.style.display = this.checked ? '' : 'none';
 }
}

// Save customization
function saveCustomization() {
 console.log('Saving customization');

 const checkboxes = document.querySelectorAll('.widget-toggle input[type="checkbox"]');
 const selectedWidgets = [];

 checkboxes.forEach(function (checkbox) {
  if (checkbox.checked) {
   selectedWidgets.push(checkbox.value);
  }
 });

 console.log('Selected widgets:', selectedWidgets);

 // Save widget visibility
 localStorage.setItem('dashboardWidgets', JSON.stringify(selectedWidgets));

 // Save widget order
 saveDashboardLayout();

 // Apply visibility
 updateWidgetVisibility(selectedWidgets);

 console.log('Customization saved to localStorage');

 // Show brief confirmation
 showSaveConfirmation();
}

// Show save confirmation
function showSaveConfirmation() {
 const btn = document.getElementById('customizeToggleBtn');
 const textElement = btn.querySelector('#customizeBtnText');
 const originalText = 'Customize';

 textElement.textContent = 'Saved!';
 btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

 setTimeout(function () {
  textElement.textContent = originalText;
  btn.style.background = '';
 }, 1500);
}

// Get currently visible widgets
function getVisibleWidgets() {
 const widgets = document.querySelectorAll('.widget');
 const visibleWidgets = [];

 widgets.forEach(function (widget) {
  if (widget.style.display !== 'none') {
   visibleWidgets.push(widget.dataset.widgetId);
  }
 });

 return visibleWidgets;
}

// Update widget visibility
function updateWidgetVisibility(selectedWidgets) {
 console.log('Updating widget visibility for:', selectedWidgets);
 const widgets = document.querySelectorAll('.widget');

 widgets.forEach(function (widget) {
  const widgetId = widget.dataset.widgetId;
  if (selectedWidgets.includes(widgetId)) {
   widget.style.display = '';
  } else {
   widget.style.display = 'none';
  }
 });
}

// Save dashboard layout (widget order)
function saveDashboardLayout() {
 const widgetsGrid = document.getElementById('widgetsGrid');
 const widgets = widgetsGrid.querySelectorAll('.widget');
 const layout = [];

 widgets.forEach(function (widget) {
  layout.push(widget.dataset.widgetId);
 });

 console.log('Saving layout:', layout);
 localStorage.setItem('dashboardLayout', JSON.stringify(layout));
}

// Load dashboard layout and apply widget order
function loadDashboardLayout() {
 const savedLayout = localStorage.getItem('dashboardLayout');
 const savedWidgets = localStorage.getItem('dashboardWidgets');

 if (savedLayout) {
  try {
   const layout = JSON.parse(savedLayout);
   const widgetsGrid = document.getElementById('widgetsGrid');

   if (!widgetsGrid) {
    console.error('widgetsGrid element not found');
    return;
   }

   console.log('Reordering widgets based on saved layout');
   layout.forEach(function (widgetId) {
    const widget = widgetsGrid.querySelector('[data-widget-id="' + widgetId + '"]');
    if (widget) {
     widgetsGrid.appendChild(widget);
    }
   });
  } catch (e) {
   console.error('Error parsing saved layout:', e);
  }
 }

 if (savedWidgets) {
  try {
   const selectedWidgets = JSON.parse(savedWidgets);
   updateWidgetVisibility(selectedWidgets);
  } catch (e) {
   console.error('Error parsing saved widgets:', e);
  }
 }
}

// Initialize all widgets
function initializeWidgets() {
 console.log('Initializing widgets');
 // Widget initialization happens when data is loaded
}

// Load dashboard data
async function loadDashboardData() {
 try {
  // Get data from storage
  const transactions = await window.storage.getTransactions();
  const tasks = await window.storage.getTasks();
  const bills = await window.storage.getBills();
  const goals = await window.storage.getGoals();
  const notes = await window.storage.getNotes();
  const events = await window.storage.getEvents();

  // Calculate stats
  const stats = calculateStats(transactions, tasks, bills);

  // Update quick stats
  updateQuickStats(stats);

  // Update widgets
  updateFinancialWidget(stats);
  updateTasksWidget(tasks);
  updateBillsWidget(bills);
  updateGoalsWidget(goals);
  updateNotesWidget(notes);
  updateEventsWidget(events);

  // Update chart data
  updateChartData(transactions);

 } catch (error) {
  console.error('Error loading dashboard data:', error);
 }
}

// Calculate statistics
function calculateStats(transactions, tasks, bills) {
 const now = new Date();
 const currentMonth = now.getMonth();
 const currentYear = now.getFullYear();

 let monthlyIncome = 0;
 let monthlyExpenses = 0;

 transactions.forEach(t => {
  const tDate = new Date(t.date);
  if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
   if (t.type === 'INCOME') {
    monthlyIncome += parseFloat(t.amount);
   } else {
    monthlyExpenses += parseFloat(t.amount);
   }
  }
 });

 const pendingTasks = tasks.filter(t => t.status === 'pending').length;
 const upcomingBills = bills.filter(b => !b.isPaid).length;

 return {
  monthlyIncome,
  monthlyExpenses,
  netSavings: monthlyIncome - monthlyExpenses,
  pendingTasks,
  upcomingBills
 };
}

// Update quick stats bar
function updateQuickStats(stats) {
 document.getElementById('stat-income').textContent = formatCurrency(stats.monthlyIncome);
 document.getElementById('stat-expense').textContent = formatCurrency(stats.monthlyExpenses);
 document.getElementById('stat-savings').textContent = formatCurrency(stats.netSavings);
 document.getElementById('stat-tasks').textContent = stats.pendingTasks;
}

// Update financial summary widget
function updateFinancialWidget(stats) {
 document.getElementById('widget-income').textContent = formatCurrency(stats.monthlyIncome);
 document.getElementById('widget-expense').textContent = formatCurrency(stats.monthlyExpenses);
 document.getElementById('widget-savings').textContent = formatCurrency(stats.netSavings);
}

// Update tasks widget
function updateTasksWidget(tasks) {
 const todayTasks = tasks.filter(task => {
  if (task.status === 'completed') return false;
  const taskDate = new Date(task.dueDate);
  const today = new Date();
  return taskDate.toDateString() === today.toDateString();
 }).slice(0, 3);

 const content = document.getElementById('widget-tasks-content');
 const count = document.getElementById('tasks-count');

 count.textContent = todayTasks.length;

 if (todayTasks.length === 0) {
  content.innerHTML = `
   <div class="empty-state">
    <span class="empty-icon">✓</span>
    <p>No tasks for today</p>
   </div>
  `;
 } else {
  const html = `
   <ul class="item-list">
    ${todayTasks.map(task => `
     <li class="item">
      <div class="item-content">
       <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
       <span class="item-title">${escapeHtml(task.title)}</span>
      </div>
      <span class="item-time">${formatTime(task.dueDate)}</span>
     </li>
    `).join('')}
   </ul>
  `;
  content.innerHTML = html;
 }
}

// Update bills widget
function updateBillsWidget(bills) {
 const upcomingBills = bills.filter(bill => !bill.isPaid).slice(0, 3);

 const content = document.getElementById('widget-bills-content');
 const count = document.getElementById('bills-count');

 count.textContent = upcomingBills.length;

 if (upcomingBills.length === 0) {
  content.innerHTML = `
   <div class="empty-state">
    <span class="empty-icon">🧾</span>
    <p>No upcoming bills</p>
   </div>
  `;
 } else {
  const html = `
   <ul class="item-list">
    ${upcomingBills.map(bill => `
     <li class="item">
      <div class="item-content">
       <span class="item-title">${escapeHtml(bill.name)}</span>
      </div>
      <span class="item-time">${formatCurrency(bill.amount)}</span>
     </li>
    `).join('')}
   </ul>
  `;
  content.innerHTML = html;
 }
}

// Update goals widget
function updateGoalsWidget(goals) {
 const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3);

 const content = document.getElementById('widget-goals-content');
 const count = document.getElementById('goals-count');

 count.textContent = activeGoals.length;

 if (activeGoals.length === 0) {
  content.innerHTML = `
   <div class="empty-state">
    <span class="empty-icon">🎯</span>
    <p>No active goals</p>
   </div>
  `;
 } else {
  const html = activeGoals.map(goal => {
   const progress = (goal.currentAmount / goal.targetAmount) * 100;
   return `
    <div class="goal-item">
     <div class="goal-header">
      <span class="goal-title">${escapeHtml(goal.name)}</span>
      <span class="goal-amount">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</span>
     </div>
     <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress}%"></div>
     </div>
    </div>
   `;
  }).join('');
  content.innerHTML = html;
 }
}

// Update notes widget
function updateNotesWidget(notes) {
 const recentNotes = notes.slice(0, 3);

 const content = document.getElementById('widget-notes-content');

 if (recentNotes.length === 0) {
  content.innerHTML = `
   <div class="empty-state">
    <span class="empty-icon">📝</span>
    <p>No notes yet</p>
   </div>
  `;
 } else {
  const html = recentNotes.map(note => `
   <div class="note-item">
    <h4 class="note-title">${escapeHtml(note.title)}</h4>
    <p class="note-preview">${escapeHtml(note.content.substring(0, 80))}${note.content.length > 80 ? '...' : ''}</p>
    <span class="note-date">${formatDate(note.updatedAt)}</span>
   </div>
  `).join('');
  content.innerHTML = html;
 }
}

// Update events widget
function updateEventsWidget(events) {
 const now = new Date();
 const upcomingEvents = events
  .filter(e => new Date(e.startDate) >= now)
  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  .slice(0, 3);

 const content = document.getElementById('widget-events-content');
 const count = document.getElementById('events-count');

 count.textContent = upcomingEvents.length;

 if (upcomingEvents.length === 0) {
  content.innerHTML = `
   <div class="empty-state">
    <span class="empty-icon">📅</span>
    <p>No upcoming events</p>
   </div>
  `;
 } else {
  const html = `
   <ul class="item-list">
    ${upcomingEvents.map(event => `
     <li class="item">
      <div class="item-content">
       <span class="item-title">${escapeHtml(event.title)}</span>
      </div>
      <span class="item-time">${formatDate(event.startDate)}</span>
     </li>
    `).join('')}
   </ul>
  `;
  content.innerHTML = html;
 }
}

// Chart Initialization
function initializeCharts() {
 if (typeof Chart === 'undefined') {
  console.warn('Chart.js not loaded');
  return;
 }

 initializeExpenseChart();
 initializeTrendChart();
}

// Initialize Expense Chart
function initializeExpenseChart() {
 const canvas = document.getElementById('expenseChart');
 if (!canvas) {
  console.log('Expense chart canvas not found');
  return;
 }

 const ctx = canvas.getContext('2d');

 // Destroy existing chart if any
 if (expenseChartInstance) {
  expenseChartInstance.destroy();
 }

 // Sample data - will be replaced with real data
 const data = {
  labels: ['Food & Dining', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Others'],
  datasets: [{
   data: [850, 420, 680, 920, 350, 280],
   backgroundColor: [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899'
   ],
   borderWidth: 0
  }]
 };

 expenseChartInstance = new Chart(ctx, {
  type: 'doughnut',
  data: data,
  options: {
   responsive: true,
   maintainAspectRatio: true,
   plugins: {
    legend: {
     position: 'bottom',
     labels: {
      padding: 15,
      font: {
       size: 11,
       family: "'Segoe UI', sans-serif"
      },
      usePointStyle: true,
      pointStyle: 'circle'
     }
    },
    tooltip: {
     callbacks: {
      label: function (context) {
       const label = context.label || '';
       const value = context.parsed || 0;
       const total = context.dataset.data.reduce((a, b) => a + b, 0);
       const percentage = ((value / total) * 100).toFixed(1);
       return label + ': $' + value.toFixed(2) + ' (' + percentage + '%)';
      }
     }
    }
   },
   cutout: '65%'
  }
 });
}

// Initialize Trend Chart
function initializeTrendChart() {
 const canvas = document.getElementById('trendChart');
 if (!canvas) {
  console.log('Trend chart canvas not found');
  return;
 }

 const ctx = canvas.getContext('2d');

 // Destroy existing chart if any
 if (trendChartInstance) {
  trendChartInstance.destroy();
 }

 // Sample data - will be replaced with real data
 const data = {
  labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
  datasets: [
   {
    label: 'Income',
    data: [3200, 3500, 3300, 3800, 3600, 4000],
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 3,
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: '#10b981',
    pointBorderColor: '#fff',
    pointBorderWidth: 2
   },
   {
    label: 'Expenses',
    data: [2800, 3200, 2900, 3100, 3400, 3300],
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 3,
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: '#ef4444',
    pointBorderColor: '#fff',
    pointBorderWidth: 2
   }
  ]
 };

 trendChartInstance = new Chart(ctx, {
  type: 'line',
  data: data,
  options: {
   responsive: true,
   maintainAspectRatio: true,
   interaction: {
    mode: 'index',
    intersect: false,
   },
   plugins: {
    legend: {
     position: 'top',
     align: 'end',
     labels: {
      padding: 15,
      font: {
       size: 11,
       family: "'Segoe UI', sans-serif",
       weight: '600'
      },
      usePointStyle: true,
      pointStyle: 'circle',
      boxWidth: 8
     }
    },
    tooltip: {
     backgroundColor: 'rgba(0, 0, 0, 0.8)',
     padding: 12,
     callbacks: {
      label: function (context) {
       return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
      }
     }
    }
   },
   scales: {
    x: {
     grid: {
      display: false
     },
     ticks: {
      font: {
       size: 11
      }
     }
    },
    y: {
     beginAtZero: true,
     grid: {
      color: '#f3f4f6',
      drawBorder: false
     },
     ticks: {
      font: {
       size: 11
      },
      callback: function (value) {
       return '$' + value;
      }
     }
    }
   }
  }
 });
}

// Update chart data with real transactions
function updateChartData(transactions) {
 // This function will be called to update charts with real data
 // Implementation depends on your data structure
 console.log('Chart data update with', transactions.length, 'transactions');
}

// Utility Functions
function formatCurrency(amount) {
 return new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
 }).format(amount);
}

function formatDate(dateString) {
 const date = new Date(dateString);
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateString) {
 const date = new Date(dateString);
 return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
 const div = document.createElement('div');
 div.textContent = text;
 return div.innerHTML;
}

// Export for use in other scripts
window.dashboardWidgets = {
 loadDashboardData,
 initializeCharts,
 toggleEditMode
};
