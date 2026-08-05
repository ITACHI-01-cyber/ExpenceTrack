/**
 * guestStorage.js
 * 
 * localStorage-backed data service for Guest / Preview mode.
 * Mirrors the shape of the backend API so pages can swap seamlessly.
 */

// ─── Helpers ──────────────────────────────────────────────
const LS_KEYS = {
  wallets: 'guest-wallets',
  transactions: 'guest-transactions',
  goals: 'guest-goals',
  budget: 'guest-budget',
  seeded: 'guest-seeded',
};

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const genId = () =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Demo Seed Data ───────────────────────────────────────
const DEMO_WALLETS = [
  {
    id: genId(),
    bankName: 'HDFC Bank',
    cardType: 'debit',
    cardBrand: 'Visa',
    cardNumber: '4111222233334444',
    cardHolderName: 'Guest User',
    expiryDate: '12/28',
    balance: 24500,
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    designId: 'midnight-aurora',
  },
  {
    id: genId(),
    bankName: 'Paytm',
    cardType: 'upi',
    cardBrand: '',
    cardNumber: 'guest@paytm',
    cardHolderName: 'Guest User',
    expiryDate: '',
    balance: 3200,
    primaryColor: '#00BAF2',
    secondaryColor: '#003087',
    designId: 'ocean-gradient',
  },
];

const makeDemoTransactions = (wallets) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const makeDate = (dayOffset) => {
    const d = new Date(thisYear, thisMonth, now.getDate() - dayOffset);
    return d.toISOString().slice(0, 16);
  };

  return [
    {
      id: genId(),
      type: 'income',
      amount: 50000,
      category: 'Salary',
      description: 'Monthly salary credited',
      date: makeDate(25),
      isRecurring: true,
      walletId: wallets[0]?.id || '',
    },
    {
      id: genId(),
      type: 'expense',
      amount: 2400,
      category: 'Groceries',
      description: 'Big Basket weekly order',
      date: makeDate(5),
      isRecurring: false,
      walletId: wallets[0]?.id || '',
    },
    {
      id: genId(),
      type: 'expense',
      amount: 799,
      category: 'Subscriptions',
      description: 'Netflix premium plan',
      date: makeDate(10),
      isRecurring: true,
      walletId: wallets[1]?.id || '',
    },
    {
      id: genId(),
      type: 'expense',
      amount: 1500,
      category: 'Food & Dining',
      description: 'Team dinner at Swiggy',
      date: makeDate(3),
      isRecurring: false,
      walletId: wallets[0]?.id || '',
    },
    {
      id: genId(),
      type: 'expense',
      amount: 350,
      category: 'Transport',
      description: 'Uber ride to office',
      date: makeDate(1),
      isRecurring: false,
      walletId: wallets[1]?.id || '',
    },
  ];
};

const DEMO_GOALS = [
  {
    id: genId(),
    title: 'Emergency Fund',
    amount: 10000,
    medium: 'Bank Account',
    completed: false,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  {
    id: genId(),
    title: 'Invest in Mutual Funds',
    amount: 5000,
    medium: 'Grow App',
    completed: true,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
];

const DEMO_BUDGET = {
  monthlyIncome: 50000,
  budgetLimit: 35000,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

// ─── Seed ─────────────────────────────────────────────────
const seedDemoData = () => {
  if (read(LS_KEYS.seeded)) return; // already seeded

  write(LS_KEYS.wallets, DEMO_WALLETS);
  const txs = makeDemoTransactions(DEMO_WALLETS);
  write(LS_KEYS.transactions, txs);
  write(LS_KEYS.goals, DEMO_GOALS);
  write(LS_KEYS.budget, DEMO_BUDGET);
  write(LS_KEYS.seeded, true);
};

// ─── Cleanup ──────────────────────────────────────────────
const clearAll = () => {
  Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key));
};

// ─── Wallet Service ───────────────────────────────────────
const wallets = {
  getAll: () => read(LS_KEYS.wallets) || [],

  save: (wallet, walletId = null) => {
    const list = wallets.getAll();
    if (walletId) {
      const idx = list.findIndex((w) => w.id === walletId);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...wallet, id: walletId };
      write(LS_KEYS.wallets, list);
      return list[idx];
    }
    const newWallet = { ...wallet, id: genId(), balance: wallet.balance || 0 };
    list.push(newWallet);
    write(LS_KEYS.wallets, list);
    return newWallet;
  },

  addMoney: (walletId, amount) => {
    const list = wallets.getAll();
    const idx = list.findIndex((w) => w.id === walletId);
    if (idx === -1) return null;
    list[idx].balance = (list[idx].balance || 0) + Number(amount);
    write(LS_KEYS.wallets, list);
    return list[idx];
  },

  remove: (walletId) => {
    const list = wallets.getAll().filter((w) => w.id !== walletId);
    write(LS_KEYS.wallets, list);
    return true;
  },
};

// ─── Transactions Service ─────────────────────────────────
const transactions = {
  getAll: (params = {}) => {
    let list = read(LS_KEYS.transactions) || [];

    // Filter by date params (mirrors backend query API)
    if (params.month && params.year) {
      list = list.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() + 1 === Number(params.month) && d.getFullYear() === Number(params.year);
      });
    } else if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((tx) => {
        const d = new Date(tx.date);
        return d >= start && d <= end;
      });
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  create: (tx) => {
    const list = read(LS_KEYS.transactions) || [];
    const newTx = { ...tx, id: genId() };
    list.push(newTx);
    write(LS_KEYS.transactions, list);

    // If linked to a wallet, update wallet balance
    if (newTx.walletId) {
      const allWallets = wallets.getAll();
      const idx = allWallets.findIndex((w) => w.id === newTx.walletId);
      if (idx !== -1) {
        if (newTx.type === 'expense') {
          allWallets[idx].balance = Math.max(0, (allWallets[idx].balance || 0) - Number(newTx.amount));
        } else {
          allWallets[idx].balance = (allWallets[idx].balance || 0) + Number(newTx.amount);
        }
        write(LS_KEYS.wallets, allWallets);
      }
    }

    return newTx;
  },

  update: (id, tx) => {
    const list = read(LS_KEYS.transactions) || [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...tx, id };
    write(LS_KEYS.transactions, list);
    return list[idx];
  },

  remove: (id) => {
    const list = (read(LS_KEYS.transactions) || []).filter((t) => t.id !== id);
    write(LS_KEYS.transactions, list);
    return true;
  },
};

// ─── Goals Service ────────────────────────────────────────
const goals = {
  getAll: (params = {}) => {
    let list = read(LS_KEYS.goals) || [];
    if (params.month && params.year) {
      list = list.filter(
        (g) => g.month === Number(params.month) && g.year === Number(params.year)
      );
    }
    return list;
  },

  create: (goal) => {
    const list = read(LS_KEYS.goals) || [];
    const newGoal = { ...goal, id: genId() };
    list.push(newGoal);
    write(LS_KEYS.goals, list);
    return newGoal;
  },

  update: (id, goal) => {
    const list = read(LS_KEYS.goals) || [];
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...goal, id };
    write(LS_KEYS.goals, list);
    return list[idx];
  },

  updateStatus: (id, completed) => {
    const list = read(LS_KEYS.goals) || [];
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx].completed = completed;
    write(LS_KEYS.goals, list);
    return list[idx];
  },

  remove: (id) => {
    const list = (read(LS_KEYS.goals) || []).filter((g) => g.id !== id);
    write(LS_KEYS.goals, list);
    return true;
  },
};

// ─── Budget / Summary Service ─────────────────────────────
const budget = {
  get: () => read(LS_KEYS.budget) || { monthlyIncome: 0, budgetLimit: 0 },

  save: (payload) => {
    const current = budget.get();
    const updated = { ...current, ...payload };
    write(LS_KEYS.budget, updated);
    return updated;
  },

  getSummary: () => {
    const b = budget.get();
    const allWallets = wallets.getAll();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const txs = transactions.getAll({ month, year });

    let monthlySpent = 0;
    let monthlyIncome = 0;
    txs.forEach((tx) => {
      if (tx.type === 'expense') monthlySpent += tx.amount;
      if (tx.type === 'income') monthlyIncome += tx.amount;
    });

    const availableBalance = allWallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    return {
      monthlyIncome: b.monthlyIncome || monthlyIncome,
      monthlyBudgetLimit: b.budgetLimit || 0,
      monthlySpent,
      availableBalance,
    };
  },
};

const guestStorage = {
  seedDemoData,
  clearAll,
  wallets,
  transactions,
  goals,
  budget,
};

export default guestStorage;
