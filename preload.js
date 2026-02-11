// preload.js - Preload Script (Bridge between Main and Renderer)
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electronAPI', {
 // User Management
 registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
 loginUser: (credentials) => ipcRenderer.invoke('login-user', credentials),
 updateProfile: (userId, data) => ipcRenderer.invoke('update-profile', { userId, data }),
 changePassword: (userId, oldPassword, newPassword) => ipcRenderer.invoke('change-password', { userId, oldPassword, newPassword }),

 // Transactions
 getTransactions: (userId) => ipcRenderer.invoke('get-transactions', userId),
 addTransaction: (userId, transaction) => ipcRenderer.invoke('add-transaction', { userId, transaction }),
 updateTransaction: (transactionId, transaction) => ipcRenderer.invoke('update-transaction', { transactionId, transaction }),
 deleteTransaction: (transactionId) => ipcRenderer.invoke('delete-transaction', transactionId),
 getMonthlyTotals: (userId, month, year) => ipcRenderer.invoke('get-monthly-totals', { userId, month, year }),
 getExpensesByCategory: (userId, month, year) => ipcRenderer.invoke('get-expenses-by-category', { userId, month, year }),

 // Categories
 getCategories: () => ipcRenderer.invoke('get-categories'),

 // Tasks
 getTasks: (userId) => ipcRenderer.invoke('get-tasks', userId),
 addTask: (userId, task) => ipcRenderer.invoke('add-task', { userId, task }),
 updateTask: (taskId, task) => ipcRenderer.invoke('update-task', { taskId, task }),
 deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
 completeTask: (taskId) => ipcRenderer.invoke('complete-task', taskId),

 // Bills
 getBills: (userId) => ipcRenderer.invoke('get-bills', userId),
 addBill: (userId, bill) => ipcRenderer.invoke('add-bill', { userId, bill }),
 updateBill: (billId, bill) => ipcRenderer.invoke('update-bill', { billId, bill }),
 deleteBill: (billId) => ipcRenderer.invoke('delete-bill', billId),
 markBillPaid: (billId) => ipcRenderer.invoke('mark-bill-paid', billId),
 getUpcomingBills: (userId, days) => ipcRenderer.invoke('get-upcoming-bills', { userId, days }),

 // Goals
 getGoals: (userId) => ipcRenderer.invoke('get-goals', userId),
 addGoal: (userId, goal) => ipcRenderer.invoke('add-goal', { userId, goal }),
 updateGoal: (goalId, goal) => ipcRenderer.invoke('update-goal', { goalId, goal }),
 deleteGoal: (goalId) => ipcRenderer.invoke('delete-goal', goalId),
 markGoalAchieved: (goalId) => ipcRenderer.invoke('mark-goal-achieved', goalId),
 getGoalMilestones: (goalId) => ipcRenderer.invoke('get-goal-milestones', goalId),
 addMilestone: (goalId, milestone) => ipcRenderer.invoke('add-milestone', { goalId, milestone }),
 completeMilestone: (milestoneId) => ipcRenderer.invoke('complete-milestone', milestoneId),

 // Events
 getEvents: (userId) => ipcRenderer.invoke('get-events', userId),
 addEvent: (userId, eventData) => ipcRenderer.invoke('add-event', { userId, eventData }),
 deleteEvent: (eventId) => ipcRenderer.invoke('delete-event', eventId),
 getUpcomingEvents: (userId, days) => ipcRenderer.invoke('get-upcoming-events', { userId, days }),

 // Notes
 getNotes: (userId) => ipcRenderer.invoke('get-notes', userId),
 addNote: (userId, note) => ipcRenderer.invoke('add-note', { userId, note }),
 updateNote: (noteId, note) => ipcRenderer.invoke('update-note', { noteId, note }),
 deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
 searchNotes: (userId, keyword) => ipcRenderer.invoke('search-notes', { userId, keyword })
});

console.log('Preload script loaded successfully');