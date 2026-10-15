import api from './api';

const requireData = (response, resource) => {
  const payload = response?.data;
  if (payload?.success !== true || payload.data == null) {
    throw new Error(payload?.message || `The server did not confirm ${resource}.`);
  }
  return payload.data;
};

const requireSuccess = (response, resource) => {
  const payload = response?.data;
  if (payload?.success !== true) {
    throw new Error(payload?.message || `The server did not confirm ${resource}.`);
  }
};

const getAll = async () => {
  const res = await api.get('/wallet');
  return requireData(res, 'wallet retrieval');
};

const save = async (wallet, walletId = null) => {
  if (walletId) {
    const res = await api.put(`/wallet/${walletId}`, wallet);
    return requireData(res, 'card update');
  }
  const res = await api.post('/wallet', wallet);
  return requireData(res, 'card creation');
};

const updateCustomization = async (walletId, customization) => {
  const res = await api.patch(`/wallet/${walletId}/customization`, customization);
  return requireData(res, 'card customization update');
};

const addMoney = async (walletId, amount) => {
  const res = await api.patch(`/wallet/${walletId}/add-money`, null, { params: { amount } });
  return requireData(res, 'wallet balance update');
};

const remove = async (walletId) => {
  const res = await api.delete(`/wallet/${walletId}`);
  requireSuccess(res, 'wallet deletion');
  return true;
};

const repay = async (cardId, request) => {
  const res = await api.post(`/wallet/${cardId}/repayments`, request);
  return requireData(res, 'credit repayment');
};

const reverseRepayment = async (cardId, repaymentId) => {
  const res = await api.delete(`/wallet/${cardId}/repayments/${repaymentId}`);
  requireSuccess(res, 'repayment reversal');
  return true;
};

const getAllRepayments = async (params = {}) => {
  const res = await api.get('/wallet/repayments', { params });
  return requireData(res, 'credit repayments retrieval');
};

const getStatements = async (cardId) => {
  const res = await api.get(`/wallet/${cardId}/statements`);
  return requireData(res, 'credit statements');
};

const generateStatement = async (cardId, asOfDate) => {
  const res = await api.post(`/wallet/${cardId}/statements/generate`, asOfDate ? { asOfDate } : {});
  return requireData(res, 'statement generation');
};

const getCreditActivity = async (cardId) => {
  const res = await api.get(`/wallet/${cardId}/activity`);
  return requireData(res, 'credit activity');
};

const recordPurchase = async (purchase) => {
  const res = await api.post('/transactions', { ...purchase, type: 'expense' });
  return requireData(res, 'credit purchase');
};

const recordRefund = async (purchaseId, request) => {
  const res = await api.post(`/transactions/${purchaseId}/refunds`, request);
  return requireData(res, 'credit card refund');
};

export default {
  getAll,
  save,
  updateCustomization,
  addMoney,
  remove,
  repay,
  reverseRepayment,
  getAllRepayments,
  getStatements,
  generateStatement,
  getCreditActivity,
  recordPurchase,
  recordRefund
};
