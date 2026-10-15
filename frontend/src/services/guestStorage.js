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
  creditRepayments: 'guest-credit-repayments',
  creditStatements: 'guest-credit-statements',
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
    cardNumber: '4444',
    cardHolderName: 'Guest User',
    expiryDate: '12/28',
    balance: 24500,
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    designPreset: 'midnight',
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
    designPreset: 'upi-ocean',
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
      const wasConfigured = Boolean(list[idx].creditTermsConfigured);
      const previousOutstandingBalance = list[idx].outstandingBalance;
      list[idx] = { ...list[idx], ...wallet, id: walletId };
      if (wasConfigured) {
        list[idx].outstandingBalance = previousOutstandingBalance;
        list[idx].creditOpeningBalance = wallet.creditOpeningBalance ?? list[idx].creditOpeningBalance;
      } else if (wallet.creditTermsConfigured) {
        list[idx].creditOpeningBalance = Number(wallet.outstandingBalance);
        list[idx].creditTermsConfiguredAt = new Date().toISOString();
        list[idx].balance = null;
      }
      write(LS_KEYS.wallets, list);
      return list[idx];
    }
    const newWallet = {
      ...wallet,
      id: genId(),
      balance: wallet.creditTermsConfigured ? null : (wallet.balance || 0),
      outstandingBalance: wallet.creditTermsConfigured ? Number(wallet.outstandingBalance) : null,
      creditTermsConfigured: Boolean(wallet.creditTermsConfigured),
      creditOpeningBalance: wallet.creditTermsConfigured ? Number(wallet.outstandingBalance) : null,
      creditTermsConfiguredAt: wallet.creditTermsConfigured ? new Date().toISOString() : null,
    };
    list.push(newWallet);
    write(LS_KEYS.wallets, list);
    return newWallet;
  },

  addMoney: (walletId, amount) => {
    const list = wallets.getAll();
    const idx = list.findIndex((w) => w.id === walletId);
    if (idx === -1) return null;
    if (list[idx].cardType?.toLowerCase() === 'credit') {
      throw new Error('Credit card balances can only change through purchases and repayments.');
    }
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
    newTx.date ||= new Date().toISOString();
    const linkedWallet = wallets.getAll().find((w) => w.id === newTx.walletId);
    if (linkedWallet?.cardType === 'credit') {
      if (newTx.type !== 'expense') throw new Error('Credit card transactions must be expenses.');
      if (!linkedWallet.creditTermsConfigured) throw new Error('Configure credit terms before recording a purchase.');
      const amount = Number(newTx.amount);
      if (linkedWallet.outstandingBalance + amount > linkedWallet.creditLimit) throw new Error('Purchase exceeds available credit.');
      linkedWallet.outstandingBalance += amount;
      const allWallets = wallets.getAll();
      allWallets[allWallets.findIndex((w) => w.id === linkedWallet.id)] = linkedWallet;
      write(LS_KEYS.wallets, allWallets);
      newTx.transactionKind = 'purchase';
    } else if (newTx.walletId) {
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

    newTx.transactionKind ||= 'standard';
    list.push(newTx);
    write(LS_KEYS.transactions, list);
    return newTx;
  },

  recordPurchase: (tx) => transactions.create({ ...tx, type: 'expense' }),

  repay: (cardId, request) => {
    const list = wallets.getAll();
    const card = list.find((w) => w.id === cardId);
    const source = list.find((w) => w.id === request.sourceWalletId);
    if (!card || !source) throw new Error('Choose a credit card and a source wallet.');
    if (source.cardType?.toLowerCase() === 'credit') throw new Error('Credit cards cannot be repayment sources.');
    if (!request.idempotencyKey?.trim()) throw new Error('An idempotency key is required.');
    if (!card.creditTermsConfigured) throw new Error('Configure credit terms before recording a repayment.');
    const existing = (read(LS_KEYS.creditRepayments) || []).find((item) => item.idempotencyKey === request.idempotencyKey);
    if (existing) {
      if (existing.walletId !== cardId || existing.sourceWalletId !== request.sourceWalletId
          || existing.statementId !== (request.statementId || null)
          || Number(existing.amount) !== Number(request.amount)) {
        throw new Error('Idempotency key was already used for a different repayment.');
      }
      return { ...existing, outstandingBalance: card.outstandingBalance, sourceWalletBalance: source.balance, replayed: true };
    }
    const amount = Number(request.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > card.outstandingBalance || amount > (source.balance || 0)) {
      throw new Error('Repayment must be positive and within the card balance and source wallet balance.');
    }
    card.outstandingBalance -= amount;
    source.balance = (source.balance || 0) - amount;
    write(LS_KEYS.wallets, list);
    const repayment = {
      id: genId(), walletId: cardId, sourceWalletId: source.id,
      statementId: request.statementId || null, amount, date: request.date || new Date().toISOString(),
      transactionKind: 'repayment', idempotencyKey: request.idempotencyKey,
    };
    const repayments = read(LS_KEYS.creditRepayments) || [];
    repayments.push(repayment);
    write(LS_KEYS.creditRepayments, repayments);
    return { ...repayment, outstandingBalance: card.outstandingBalance, sourceWalletBalance: source.balance, replayed: false };
  },

  reverseRepayment: (cardId, repaymentId) => {
    const repayments = read(LS_KEYS.creditRepayments) || [];
    const idx = repayments.findIndex((r) => r.id === repaymentId && r.walletId === cardId);
    if (idx === -1) throw new Error('Repayment record not found.');
    const repayment = repayments[idx];
    const list = wallets.getAll();
    const card = list.find((w) => w.id === cardId);
    const source = list.find((w) => w.id === repayment.sourceWalletId);
    if (!card) throw new Error('Credit card not found.');
    const amount = Number(repayment.amount);
    const nextOutstanding = Number(card.outstandingBalance || 0) + amount;
    if (nextOutstanding > Number(card.creditLimit)) {
      throw new Error('Reversing this repayment would cause card balance to exceed credit limit.');
    }
    card.outstandingBalance = nextOutstanding;
    if (source) {
      source.balance = Number(source.balance || 0) + amount;
    }
    write(LS_KEYS.wallets, list);
    repayments.splice(idx, 1);
    write(LS_KEYS.creditRepayments, repayments);
    return true;
  },

  getAllRepayments: (params = {}) => {
    let list = read(LS_KEYS.creditRepayments) || [];
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((r) => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  recordRefund: (purchaseId, request) => {
    const txList = read(LS_KEYS.transactions) || [];
    const purchase = txList.find((tx) => tx.id === purchaseId && tx.transactionKind === 'purchase');
    if (!purchase) throw new Error('Refunds must reference a saved credit card purchase.');
    if (!request.idempotencyKey?.trim()) throw new Error('An idempotency key is required.');
    const previous = txList.find((tx) => tx.transactionKind === 'refund' && tx.idempotencyKey === request.idempotencyKey);
    if (previous) {
      if (previous.relatedTransactionId !== purchaseId || Math.abs(Number(previous.amount)) !== Number(request.amount)) {
        throw new Error('Idempotency key was already used for a different refund.');
      }
      return previous;
    }
    const amount = Number(request.amount);
    const alreadyRefunded = txList
      .filter((tx) => tx.transactionKind === 'refund' && tx.relatedTransactionId === purchaseId)
      .reduce((total, refund) => total + Math.abs(Number(refund.amount)), 0);
    if (!Number.isFinite(amount) || amount <= 0 || amount + alreadyRefunded > Number(purchase.amount)) {
      throw new Error('Refund must be positive and cannot exceed the unrefunded purchase amount.');
    }
    const cardList = wallets.getAll();
    const card = cardList.find((wallet) => wallet.id === purchase.walletId);
    if (!card?.creditTermsConfigured) throw new Error('The original card is not configured for credit.');
    card.outstandingBalance = Number(card.outstandingBalance || 0) - amount;
    const refundDate = request.date || new Date().toISOString();
    if (new Date(refundDate) < new Date(purchase.date)) {
      throw new Error('Refund date cannot precede the original purchase.');
    }
    const refund = {
      ...purchase,
      id: genId(),
      type: 'expense',
      amount: -amount,
      description: `Refund for ${purchase.description || 'credit card purchase'}`,
      date: refundDate,
      transactionKind: 'refund',
      idempotencyKey: request.idempotencyKey,
      relatedTransactionId: purchaseId,
      isRecurring: false,
    };
    txList.push(refund);
    const walletIndex = cardList.findIndex((wallet) => wallet.id === card.id);
    cardList[walletIndex] = card;
    write(LS_KEYS.transactions, txList);
    write(LS_KEYS.wallets, cardList);
    return refund;
  },

  getCreditActivity: (cardId) => [
    ...(read(LS_KEYS.transactions) || [])
      .filter((tx) => tx.walletId === cardId && ['purchase', 'refund'].includes(tx.transactionKind))
      .map((tx) => tx.transactionKind === 'refund' ? { ...tx, amount: Math.abs(tx.amount) } : tx),
    ...(read(LS_KEYS.creditRepayments) || [])
      .filter((repayment) => repayment.walletId === cardId),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)),

  getStatements: (cardId) => (read(LS_KEYS.creditStatements) || [])
    .filter((statement) => statement.walletId === cardId)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)),

  generateStatement: (cardId, asOfDate) => {
    const card = wallets.getAll().find((w) => w.id === cardId);
    if (!card?.creditTermsConfigured) throw new Error('Configure credit terms before generating a statement.');
    const zone = card.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const today = asOfDate || dayFormatter.format(new Date());
    const [asOfYear, asOfMonth, asOfDay] = today.split('-').map(Number);
    const local = new Date(asOfYear, asOfMonth - 1, asOfDay, 12);
    const year = local.getFullYear();
    const month = local.getMonth();
    const closingDay = card.statementClosingDay;
    let close = new Date(year, month, Math.min(closingDay, new Date(year, month + 1, 0).getDate()));
    if (close > local) {
      const prevMonth = new Date(year, month - 1, 1);
      close = new Date(prevMonth.getFullYear(), prevMonth.getMonth(),
        Math.min(closingDay, new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()));
    }
    const periodEnd = `${close.getFullYear()}-${String(close.getMonth() + 1).padStart(2, '0')}-${String(close.getDate()).padStart(2, '0')}`;
    const statements = read(LS_KEYS.creditStatements) || [];
    const existing = statements.find((statement) => statement.walletId === cardId && statement.periodEnd === periodEnd);
    if (existing) return existing;
    const nextMonth = new Date(close.getFullYear(), close.getMonth() + 1, 1);
    const due = new Date(nextMonth.getFullYear(), nextMonth.getMonth(),
      Math.min(card.paymentDueDay, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()));
    const cycleDate = (value) => dayFormatter.format(new Date(value));
    const purchases = (read(LS_KEYS.transactions) || []).filter((tx) => tx.walletId === cardId
      && tx.transactionKind === 'purchase' && cycleDate(tx.date) <= periodEnd
      && cycleDate(tx.date) >= cycleDate(card.creditTermsConfiguredAt))
      .reduce((total, tx) => total + Number(tx.amount), 0);
    const repayments = (read(LS_KEYS.creditRepayments) || []).filter((repayment) => repayment.walletId === cardId
      && cycleDate(repayment.date) <= periodEnd && cycleDate(repayment.date) >= cycleDate(card.creditTermsConfiguredAt))
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
    const refunds = (read(LS_KEYS.transactions) || []).filter((tx) => tx.walletId === cardId
      && tx.transactionKind === 'refund' && cycleDate(tx.date) <= periodEnd
      && cycleDate(tx.date) >= cycleDate(card.creditTermsConfiguredAt))
      .reduce((total, tx) => total + Math.abs(Number(tx.amount)), 0);
    const previousClose = new Date(close.getFullYear(), close.getMonth() - 1, 1);
    const priorClose = new Date(previousClose.getFullYear(), previousClose.getMonth(),
      Math.min(closingDay, new Date(previousClose.getFullYear(), previousClose.getMonth() + 1, 0).getDate()));
    const periodStart = new Date(priorClose.getFullYear(), priorClose.getMonth(), priorClose.getDate() + 1);
    const snapshot = {
      id: genId(), walletId: cardId, periodEnd,
      periodStart: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}-${String(periodStart.getDate()).padStart(2, '0')}`,
      generatedAt: new Date().toISOString(), timezone: zone, statementClosingDay: closingDay,
      dueDate: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
      statementBalance: Number(card.creditOpeningBalance || 0) + purchases - refunds - repayments,
      minimumPaymentAmount: card.minimumPaymentAmount || null,
    };
    statements.push(snapshot);
    write(LS_KEYS.creditStatements, statements);
    return snapshot;
  },

  update: (id, tx) => {
    const list = read(LS_KEYS.transactions) || [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    if (['purchase', 'refund'].includes(list[idx].transactionKind)) {
      throw new Error('Credit card purchases and refunds cannot be edited in preview mode.');
    }
    list[idx] = { ...list[idx], ...tx, id };
    write(LS_KEYS.transactions, list);
    return list[idx];
  },

  remove: (id) => {
    const transactionsList = read(LS_KEYS.transactions) || [];
    const transaction = transactionsList.find((t) => t.id === id);
    if (['purchase', 'refund'].includes(transaction?.transactionKind)) {
      throw new Error('Credit card purchases and refunds cannot be deleted in preview mode.');
    }
    const list = transactionsList.filter((t) => t.id !== id);
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

    const availableBalance = allWallets
      .filter((wallet) => wallet.cardType?.toLowerCase() !== 'credit')
      .reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

    const creditCards = allWallets.filter(
      (wallet) => wallet.cardType?.toLowerCase() === 'credit' && wallet.creditTermsConfigured
    );
    const totalCreditDebt = creditCards.reduce(
      (sum, w) => sum + Math.max(0, Number(w.outstandingBalance) || 0), 0
    );
    const totalCreditLimit = creditCards.reduce(
      (sum, w) => sum + (Number(w.creditLimit) || 0), 0
    );
    const availableCredit = creditCards.reduce(
      (sum, w) => sum + Math.max(0, (Number(w.creditLimit) || 0) - (Number(w.outstandingBalance) || 0)), 0
    );
    const creditUtilization = totalCreditLimit > 0
      ? Math.min(100, (totalCreditDebt / totalCreditLimit) * 100)
      : 0;

    const allRepayments = read(LS_KEYS.creditRepayments) || [];
    const creditRepaymentsThisMonth = allRepayments
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      monthlyIncome: b.monthlyIncome || monthlyIncome,
      monthlyBudgetLimit: b.budgetLimit || 0,
      monthlySpent,
      availableBalance,
      totalCreditDebt,
      totalCreditLimit,
      availableCredit,
      creditUtilization,
      creditRepaymentsThisMonth,
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
