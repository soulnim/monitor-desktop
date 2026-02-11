// storage.js - JSON File Storage System (No Database Required!)
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { app } = require('electron');

class Storage {
 constructor() {
  // Use Electron's userData directory (writable location)
  // This will be something like: C:\Users\User\AppData\Roaming\Monitor
  this.dataDir = path.join(app.getPath('userData'), 'data');

  // Ensure data directory exists
  if (!fs.existsSync(this.dataDir)) {
   fs.mkdirSync(this.dataDir, { recursive: true });
   console.log('Data directory created at:', this.dataDir);
  }

  // Data files
  this.files = {
   users: path.join(this.dataDir, 'users.json'),
   transactions: path.join(this.dataDir, 'transactions.json'),
   categories: path.join(this.dataDir, 'categories.json'),
   tasks: path.join(this.dataDir, 'tasks.json'),
   bills: path.join(this.dataDir, 'bills.json'),
   goals: path.join(this.dataDir, 'goals.json'),
   milestones: path.join(this.dataDir, 'milestones.json'),
   events: path.join(this.dataDir, 'events.json'),
   notes: path.join(this.dataDir, 'notes.json'),
   settings: path.join(this.dataDir, 'settings.json')
  };

  // Initialize all data files
  this.initializeDataFiles();

  console.log('Storage system initialized with JSON files');
 }

 // Initialize data files with default structure
 initializeDataFiles() {
  Object.keys(this.files).forEach(key => {
   if (!fs.existsSync(this.files[key])) {
    const defaultData = key === 'categories' ? this.getDefaultCategories() : [];
    fs.writeFileSync(this.files[key], JSON.stringify(defaultData, null, 2));
    console.log(`Created ${key}.json`);
   }
  });
 }

 // Read data from file
 readData(filename) {
  try {
   const data = fs.readFileSync(this.files[filename], 'utf8');
   return JSON.parse(data);
  } catch (error) {
   console.error(`Error reading ${filename}:`, error);
   return [];
  }
 }

 // Write data to file
 writeData(filename, data) {
  try {
   fs.writeFileSync(this.files[filename], JSON.stringify(data, null, 2));
   return true;
  } catch (error) {
   console.error(`Error writing ${filename}:`, error);
   return false;
  }
 }

 // Generate unique ID
 generateId() {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
 }

 // ==========================================
 // USER MANAGEMENT
 // ==========================================

 async registerUser(username, email, password, fullName) {
  const users = this.readData('users');

  // Check if username exists
  if (users.find(u => u.username === username)) {
   throw new Error('Username already exists');
  }

  // Check if email exists
  if (users.find(u => u.email === email)) {
   throw new Error('Email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = {
   userId: this.generateId(),
   username,
   email,
   fullName: fullName || '',
   passwordHash,
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString()
  };

  users.push(user);
  this.writeData('users', users);

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
 }

 async loginUser(username, password) {
  const users = this.readData('users');
  const user = users.find(u => u.username === username || u.email === username);

  if (!user) {
   throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
   throw new Error('Invalid credentials');
  }

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
 }

 async updateUserProfile(userId, data) {
  const users = this.readData('users');
  const index = users.findIndex(u => u.userId === userId);

  if (index === -1) {
   throw new Error('User not found');
  }

  users[index] = {
   ...users[index],
   ...data,
   updatedAt: new Date().toISOString()
  };

  this.writeData('users', users);
  return true;
 }

 async changePassword(userId, oldPassword, newPassword) {
  const users = this.readData('users');
  const user = users.find(u => u.userId === userId);

  if (!user) {
   throw new Error('User not found');
  }

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
   throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  const index = users.findIndex(u => u.userId === userId);
  users[index].passwordHash = newPasswordHash;
  users[index].updatedAt = new Date().toISOString();

  this.writeData('users', users);
  return true;
 }

 // ==========================================
 // TRANSACTIONS
 // ==========================================

 getAllTransactions(userId) {
  const transactions = this.readData('transactions');
  return transactions.filter(t => t.userId === userId)
   .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
 }

 addTransaction(userId, transaction) {
  const transactions = this.readData('transactions');

  const newTransaction = {
   transactionId: this.generateId(),
   userId,
   ...transaction,
   createdAt: new Date().toISOString()
  };

  transactions.push(newTransaction);
  this.writeData('transactions', transactions);
  return newTransaction;
 }

 updateTransaction(transactionId, transaction) {
  const transactions = this.readData('transactions');
  const index = transactions.findIndex(t => t.transactionId === transactionId);

  if (index === -1) return false;

  transactions[index] = {
   ...transactions[index],
   ...transaction,
   updatedAt: new Date().toISOString()
  };

  this.writeData('transactions', transactions);
  return true;
 }

 deleteTransaction(transactionId) {
  const transactions = this.readData('transactions');
  const filtered = transactions.filter(t => t.transactionId !== transactionId);
  this.writeData('transactions', filtered);
  return true;
 }

 getTransactionsByMonth(userId, month, year) {
  const transactions = this.getAllTransactions(userId);
  return transactions.filter(t => {
   const date = new Date(t.transactionDate);
   return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
 }

 getMonthlyTotals(userId, month, year) {
  const transactions = this.getTransactionsByMonth(userId, month, year);

  let income = 0;
  let expenses = 0;

  transactions.forEach(t => {
   if (t.transactionType === 'INCOME') {
    income += parseFloat(t.amount);
   } else {
    expenses += parseFloat(t.amount);
   }
  });

  return {
   income: income.toFixed(2),
   expenses: expenses.toFixed(2),
   netSavings: (income - expenses).toFixed(2)
  };
 }

 getExpensesByCategory(userId, month, year) {
  const transactions = this.getTransactionsByMonth(userId, month, year);
  const expenses = transactions.filter(t => t.transactionType === 'EXPENSE');

  const categoryTotals = {};
  expenses.forEach(t => {
   const cat = t.categoryName || 'Uncategorized';
   categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount);
  });

  return Object.keys(categoryTotals).map(cat => ({
   category: cat,
   amount: categoryTotals[cat].toFixed(2)
  }));
 }

 // ==========================================
 // CATEGORIES
 // ==========================================

 getDefaultCategories() {
  return [
   { categoryId: 'cat-1', categoryName: 'Food & Dining', type: 'EXPENSE' },
   { categoryId: 'cat-2', categoryName: 'Transportation', type: 'EXPENSE' },
   { categoryId: 'cat-3', categoryName: 'Shopping', type: 'EXPENSE' },
   { categoryId: 'cat-4', categoryName: 'Entertainment', type: 'EXPENSE' },
   { categoryId: 'cat-5', categoryName: 'Bills & Utilities', type: 'EXPENSE' },
   { categoryId: 'cat-6', categoryName: 'Healthcare', type: 'EXPENSE' },
   { categoryId: 'cat-7', categoryName: 'Education', type: 'EXPENSE' },
   { categoryId: 'cat-8', categoryName: 'Personal', type: 'EXPENSE' },
   { categoryId: 'cat-9', categoryName: 'Salary', type: 'INCOME' },
   { categoryId: 'cat-10', categoryName: 'Freelance', type: 'INCOME' },
   { categoryId: 'cat-11', categoryName: 'Investment', type: 'INCOME' },
   { categoryId: 'cat-12', categoryName: 'Other Income', type: 'INCOME' }
  ];
 }

 getAllCategories() {
  return this.readData('categories');
 }

 // ==========================================
 // TASKS
 // ==========================================

 getAllTasks(userId) {
  const tasks = this.readData('tasks');
  return tasks.filter(t => t.userId === userId)
   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 }

 addTask(userId, task) {
  const tasks = this.readData('tasks');

  const newTask = {
   taskId: this.generateId(),
   userId,
   ...task,
   isCompleted: false,
   createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  this.writeData('tasks', tasks);
  return newTask;
 }

 updateTask(taskId, task) {
  const tasks = this.readData('tasks');
  const index = tasks.findIndex(t => t.taskId === taskId);

  if (index === -1) return false;

  tasks[index] = {
   ...tasks[index],
   ...task,
   updatedAt: new Date().toISOString()
  };

  this.writeData('tasks', tasks);
  return true;
 }

 deleteTask(taskId) {
  const tasks = this.readData('tasks');
  const filtered = tasks.filter(t => t.taskId !== taskId);
  this.writeData('tasks', filtered);
  return true;
 }

 completeTask(taskId) {
  const tasks = this.readData('tasks');
  const index = tasks.findIndex(t => t.taskId === taskId);

  if (index === -1) return false;

  tasks[index].isCompleted = true;
  tasks[index].completedAt = new Date().toISOString();

  this.writeData('tasks', tasks);
  return true;
 }

 // ==========================================
 // BILLS
 // ==========================================

 getAllBills(userId) {
  const bills = this.readData('bills');
  return bills.filter(b => b.userId === userId)
   .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
 }

 addBill(userId, bill) {
  const bills = this.readData('bills');

  const newBill = {
   billId: this.generateId(),
   userId,
   ...bill,
   isPaid: false,
   createdAt: new Date().toISOString()
  };

  bills.push(newBill);
  this.writeData('bills', bills);
  return newBill;
 }

 updateBill(billId, bill) {
  const bills = this.readData('bills');
  const index = bills.findIndex(b => b.billId === billId);

  if (index === -1) return false;

  bills[index] = {
   ...bills[index],
   ...bill,
   updatedAt: new Date().toISOString()
  };

  this.writeData('bills', bills);
  return true;
 }

 deleteBill(billId) {
  const bills = this.readData('bills');
  const filtered = bills.filter(b => b.billId !== billId);
  this.writeData('bills', filtered);
  return true;
 }

 markBillPaid(billId) {
  const bills = this.readData('bills');
  const index = bills.findIndex(b => b.billId === billId);

  if (index === -1) return false;

  bills[index].isPaid = true;
  bills[index].paidAt = new Date().toISOString();

  this.writeData('bills', bills);
  return true;
 }

 getUpcomingBills(userId, days = 7) {
  const bills = this.getAllBills(userId);
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return bills.filter(b => {
   const dueDate = new Date(b.dueDate);
   return !b.isPaid && dueDate >= now && dueDate <= futureDate;
  });
 }

 // ==========================================
 // GOALS
 // ==========================================

 getAllGoals(userId) {
  const goals = this.readData('goals');
  return goals.filter(g => g.userId === userId)
   .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
 }

 addGoal(userId, goal) {
  const goals = this.readData('goals');

  const newGoal = {
   goalId: this.generateId(),
   userId,
   ...goal,
   currentAmount: goal.currentAmount || 0,
   isAchieved: false,
   createdAt: new Date().toISOString()
  };

  goals.push(newGoal);
  this.writeData('goals', goals);
  return newGoal;
 }

 updateGoal(goalId, goal) {
  const goals = this.readData('goals');
  const index = goals.findIndex(g => g.goalId === goalId);

  if (index === -1) return false;

  goals[index] = {
   ...goals[index],
   ...goal,
   updatedAt: new Date().toISOString()
  };

  this.writeData('goals', goals);
  return true;
 }

 deleteGoal(goalId) {
  const goals = this.readData('goals');
  const filtered = goals.filter(g => g.goalId !== goalId);
  this.writeData('goals', filtered);

  // Also delete associated milestones
  const milestones = this.readData('milestones');
  const filteredMilestones = milestones.filter(m => m.goalId !== goalId);
  this.writeData('milestones', filteredMilestones);

  return true;
 }

 markGoalAchieved(goalId) {
  const goals = this.readData('goals');
  const index = goals.findIndex(g => g.goalId === goalId);

  if (index === -1) return false;

  goals[index].isAchieved = true;
  goals[index].achievedAt = new Date().toISOString();

  this.writeData('goals', goals);
  return true;
 }

 // ==========================================
 // MILESTONES
 // ==========================================

 getGoalMilestones(goalId) {
  const milestones = this.readData('milestones');
  return milestones.filter(m => m.goalId === goalId)
   .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
 }

 addMilestone(goalId, milestone) {
  const milestones = this.readData('milestones');

  const newMilestone = {
   milestoneId: this.generateId(),
   goalId,
   ...milestone,
   isCompleted: false,
   createdAt: new Date().toISOString()
  };

  milestones.push(newMilestone);
  this.writeData('milestones', milestones);
  return newMilestone;
 }

 completeMilestone(milestoneId) {
  const milestones = this.readData('milestones');
  const index = milestones.findIndex(m => m.milestoneId === milestoneId);

  if (index === -1) return false;

  milestones[index].isCompleted = true;
  milestones[index].completedAt = new Date().toISOString();

  this.writeData('milestones', milestones);
  return true;
 }

 // ==========================================
 // EVENTS
 // ==========================================

 getAllEvents(userId) {
  const events = this.readData('events');
  return events.filter(e => e.userId === userId)
   .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
 }

 addEvent(userId, eventData) {
  const events = this.readData('events');

  const newEvent = {
   eventId: this.generateId(),
   userId,
   ...eventData,
   createdAt: new Date().toISOString()
  };

  events.push(newEvent);
  this.writeData('events', events);
  return newEvent;
 }

 deleteEvent(eventId) {
  const events = this.readData('events');
  const filtered = events.filter(e => e.eventId !== eventId);
  this.writeData('events', filtered);
  return true;
 }

 getUpcomingEvents(userId, days = 7) {
  const events = this.getAllEvents(userId);
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return events.filter(e => {
   const eventDate = new Date(e.eventDate);
   return eventDate >= now && eventDate <= futureDate;
  });
 }

 // ==========================================
 // NOTES
 // ==========================================

 getAllNotes(userId) {
  const notes = this.readData('notes');
  return notes.filter(n => n.userId === userId)
   .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
 }

 addNote(userId, note) {
  const notes = this.readData('notes');

  const newNote = {
   noteId: this.generateId(),
   userId,
   ...note,
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString()
  };

  notes.push(newNote);
  this.writeData('notes', notes);
  return newNote;
 }

 updateNote(noteId, note) {
  const notes = this.readData('notes');
  const index = notes.findIndex(n => n.noteId === noteId);

  if (index === -1) return false;

  notes[index] = {
   ...notes[index],
   ...note,
   updatedAt: new Date().toISOString()
  };

  this.writeData('notes', notes);
  return true;
 }

 deleteNote(noteId) {
  const notes = this.readData('notes');
  const filtered = notes.filter(n => n.noteId !== noteId);
  this.writeData('notes', filtered);
  return true;
 }

 searchNotes(userId, keyword) {
  const notes = this.getAllNotes(userId);
  const searchTerm = keyword.toLowerCase();

  return notes.filter(n => {
   const title = (n.title || '').toLowerCase();
   const content = (n.content || '').toLowerCase();
   return title.includes(searchTerm) || content.includes(searchTerm);
  });
 }
}

module.exports = Storage;