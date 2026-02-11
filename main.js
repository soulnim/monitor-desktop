// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Storage = require('./storage');

let mainWindow;
let storage;

function createWindow() {
 mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 1200,
  minHeight: 700,
  webPreferences: {
   nodeIntegration: false,
   contextIsolation: true,
   preload: path.join(__dirname, 'preload.js')
  },
  backgroundColor: '#1a1a2e'
 });

 mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

 // Open DevTools in development (comment out for production)
 // mainWindow.webContents.openDevTools();

 mainWindow.on('closed', function () {
  mainWindow = null;
 });
}

app.whenReady().then(() => {
 try {
  // Initialize storage AFTER app is ready
  storage = new Storage();

  createWindow();

  app.on('activate', function () {
   if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
 } catch (error) {
  console.error('Error initializing app:', error);
  // Show error dialog
  const { dialog } = require('electron');
  dialog.showErrorBox('Initialization Error', `Failed to start: ${error.message}\n\nData directory: ${app.getPath('userData')}`);
  app.quit();
 }
});

app.on('window-all-closed', function () {
 if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// IPC HANDLERS - User Management
// ==========================================

ipcMain.handle('register-user', async (event, userData) => {
 try {
  const { username, email, password, fullName } = userData;
  const user = await storage.registerUser(username, email, password, fullName);
  return { success: true, user };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('login-user', async (event, credentials) => {
 try {
  const { username, password } = credentials;
  const user = await storage.loginUser(username, password);
  return { success: true, user };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-profile', async (event, { userId, data }) => {
 try {
  await storage.updateUserProfile(userId, data);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('change-password', async (event, { userId, oldPassword, newPassword }) => {
 try {
  await storage.changePassword(userId, oldPassword, newPassword);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Transactions
// ==========================================

ipcMain.handle('get-transactions', async (event, userId) => {
 try {
  const transactions = storage.getAllTransactions(userId);
  return { success: true, transactions };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-transaction', async (event, { userId, transaction }) => {
 try {
  const newTransaction = storage.addTransaction(userId, transaction);
  return { success: true, transaction: newTransaction };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-transaction', async (event, { transactionId, transaction }) => {
 try {
  storage.updateTransaction(transactionId, transaction);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-transaction', async (event, transactionId) => {
 try {
  storage.deleteTransaction(transactionId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('get-monthly-totals', async (event, { userId, month, year }) => {
 try {
  const totals = storage.getMonthlyTotals(userId, month, year);
  return { success: true, totals };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('get-expenses-by-category', async (event, { userId, month, year }) => {
 try {
  const expenses = storage.getExpensesByCategory(userId, month, year);
  return { success: true, expenses };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Categories
// ==========================================

ipcMain.handle('get-categories', async (event) => {
 try {
  const categories = storage.getAllCategories();
  return { success: true, categories };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Tasks
// ==========================================

ipcMain.handle('get-tasks', async (event, userId) => {
 try {
  const tasks = storage.getAllTasks(userId);
  return { success: true, tasks };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-task', async (event, { userId, task }) => {
 try {
  const newTask = storage.addTask(userId, task);
  return { success: true, task: newTask };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-task', async (event, { taskId, task }) => {
 try {
  storage.updateTask(taskId, task);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-task', async (event, taskId) => {
 try {
  storage.deleteTask(taskId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('complete-task', async (event, taskId) => {
 try {
  storage.completeTask(taskId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Bills
// ==========================================

ipcMain.handle('get-bills', async (event, userId) => {
 try {
  const bills = storage.getAllBills(userId);
  return { success: true, bills };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-bill', async (event, { userId, bill }) => {
 try {
  const newBill = storage.addBill(userId, bill);
  return { success: true, bill: newBill };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-bill', async (event, { billId, bill }) => {
 try {
  storage.updateBill(billId, bill);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-bill', async (event, billId) => {
 try {
  storage.deleteBill(billId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('mark-bill-paid', async (event, billId) => {
 try {
  storage.markBillPaid(billId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('get-upcoming-bills', async (event, { userId, days }) => {
 try {
  const bills = storage.getUpcomingBills(userId, days);
  return { success: true, bills };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Goals
// ==========================================

ipcMain.handle('get-goals', async (event, userId) => {
 try {
  const goals = storage.getAllGoals(userId);
  return { success: true, goals };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-goal', async (event, { userId, goal }) => {
 try {
  const newGoal = storage.addGoal(userId, goal);
  return { success: true, goal: newGoal };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-goal', async (event, { goalId, goal }) => {
 try {
  storage.updateGoal(goalId, goal);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-goal', async (event, goalId) => {
 try {
  storage.deleteGoal(goalId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('mark-goal-achieved', async (event, goalId) => {
 try {
  storage.markGoalAchieved(goalId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('get-goal-milestones', async (event, goalId) => {
 try {
  const milestones = storage.getGoalMilestones(goalId);
  return { success: true, milestones };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-milestone', async (event, { goalId, milestone }) => {
 try {
  const newMilestone = storage.addMilestone(goalId, milestone);
  return { success: true, milestone: newMilestone };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('complete-milestone', async (event, milestoneId) => {
 try {
  storage.completeMilestone(milestoneId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Events
// ==========================================

ipcMain.handle('get-events', async (event, userId) => {
 try {
  const events = storage.getAllEvents(userId);
  return { success: true, events };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-event', async (event, { userId, eventData }) => {
 try {
  const newEvent = storage.addEvent(userId, eventData);
  return { success: true, event: newEvent };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-event', async (event, eventId) => {
 try {
  storage.deleteEvent(eventId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('get-upcoming-events', async (event, { userId, days }) => {
 try {
  const events = storage.getUpcomingEvents(userId, days);
  return { success: true, events };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

// ==========================================
// IPC HANDLERS - Notes
// ==========================================

ipcMain.handle('get-notes', async (event, userId) => {
 try {
  const notes = storage.getAllNotes(userId);
  return { success: true, notes };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('add-note', async (event, { userId, note }) => {
 try {
  const newNote = storage.addNote(userId, note);
  return { success: true, note: newNote };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('update-note', async (event, { noteId, note }) => {
 try {
  storage.updateNote(noteId, note);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('delete-note', async (event, noteId) => {
 try {
  storage.deleteNote(noteId);
  return { success: true };
 } catch (error) {
  return { success: false, error: error.message };
 }
});

ipcMain.handle('search-notes', async (event, { userId, keyword }) => {
 try {
  const notes = storage.searchNotes(userId, keyword);
  return { success: true, notes };
 } catch (error) {
  return { success: false, error: error.message };
 }
});