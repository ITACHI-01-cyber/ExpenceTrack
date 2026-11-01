/**
 * dashboardService.js
 * Thin service layer that aggregates API calls for the dashboard.
 * All data comes from real backend endpoints — no dummy data.
 */
import api from './api';
import walletService from './walletService';
import guestStorage from './guestStorage';

const dashboardService = {
  /**
   * Fetches all data needed for the dashboard in a single parallel call.
   * Returns { summary, transactions, goals, budget, wallets }
   */
  async fetchAll({ isGuest, month, year }) {
    const errors = [];

    if (isGuest) {
      const wallets = guestStorage.wallets.getAll();
      const summary = guestStorage.budget.getSummary();
      const allTx = guestStorage.transactions.getAll({ month, year });
      const sorted = [...allTx].sort((a, b) => new Date(b.date) - new Date(a.date));
      const chartTransactions = guestStorage.transactions.getAll({});
      const goals = guestStorage.goals.getAll({ month, year });
      const budget = guestStorage.budget.get(month, year);
      return { summary, transactions: sorted, chartTransactions, goals, budget, wallets, errors };
    }

    const today = new Date();
    const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const [summaryRes, txRes, chartTxRes, goalsRes, budgetRes, wallets] = await Promise.allSettled([
      api.get('/dashboard/summary'),
      api.get(`/transactions?month=${month}&year=${year}`),
      api.get('/transactions', { params: { startDate: `${year - 1}-01-01`, endDate } }),
      api.get(`/goals?month=${month}&year=${year}`),
      api.get(`/budget?month=${month}&year=${year}`),
      walletService.getAll(),
    ]);

    const checkResponse = (result, resource) => {
      if (result.status === 'rejected') {
        errors.push(result.reason);
      } else if (result.value.data?.success !== true) {
        errors.push(new Error(result.value.data?.message || `Unable to load ${resource}.`));
      }
    };

    checkResponse(summaryRes, 'dashboard summary');
    checkResponse(txRes, 'monthly transactions');
    checkResponse(chartTxRes, 'financial statistics');
    checkResponse(goalsRes, 'savings goals');
    checkResponse(budgetRes, 'monthly budget');
    if (wallets.status === 'rejected') errors.push(wallets.reason);

    const responseList = (result) => (
      result.status === 'fulfilled'
      && result.value.data?.success
      && Array.isArray(result.value.data.data)
        ? result.value.data.data
        : []
    );

    const summary = summaryRes.status === 'fulfilled' && summaryRes.value.data?.success
      ? summaryRes.value.data.data
      : null;

    const transactions = responseList(txRes).sort((a, b) => new Date(b.date) - new Date(a.date));
    const chartTransactions = responseList(chartTxRes).sort((a, b) => new Date(b.date) - new Date(a.date));

    const goals = goalsRes.status === 'fulfilled' && goalsRes.value.data?.success
      && Array.isArray(goalsRes.value.data.data)
      ? goalsRes.value.data.data
      : [];

    const budget = budgetRes.status === 'fulfilled' && budgetRes.value.data?.success
      ? budgetRes.value.data.data
      : null;

    const walletList = wallets.status === 'fulfilled' ? wallets.value || [] : [];

    return { summary, transactions, chartTransactions, goals, budget, wallets: walletList, errors };
  },

  /**
   * Fetch all transactions (no month filter) for multi-period chart.
   * Falls back gracefully if the endpoint isn't available.
   */
  async fetchAllTransactions({ isGuest }) {
    if (isGuest) {
      return guestStorage.transactions.getAll({});
    }
    try {
      const res = await api.get('/transactions');
      return res.data.success ? res.data.data : [];
    } catch {
      return [];
    }
  },
};

export default dashboardService;
