import api from './api';

const getAll = async () => {
  const res = await api.get('/wallet');
  return res.data && res.data.success ? res.data.data : [];
};

const save = async (wallet, walletId = null) => {
  if (walletId) {
    const res = await api.put(`/wallet/${walletId}`, wallet);
    return res.data && res.data.success ? res.data.data : null;
  }
  const res = await api.post('/wallet', wallet);
  return res.data && res.data.success ? res.data.data : null;
};

const addMoney = async (walletId, amount) => {
  const res = await api.patch(`/wallet/${walletId}/add-money`, null, { params: { amount } });
  return res.data && res.data.success ? res.data.data : null;
};

const remove = async (walletId) => {
  const res = await api.delete(`/wallet/${walletId}`);
  return res.data && res.data.success;
};

export default {
  getAll,
  save,
  addMoney,
  remove
};
