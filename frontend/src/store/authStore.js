import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,

  login: (userData, token) => set({ user: userData, token, isAuthenticated: true, isGuest: false }),

  loginAsGuest: () => set({
    user: { name: 'Guest', email: 'guest@preview.local' },
    token: null,
    isAuthenticated: true,
    isGuest: true,
  }),

  logout: () => {
    // Clear guest localStorage keys if in guest mode
    const state = useAuthStore.getState();
    if (state.isGuest) {
      ['guest-wallets', 'guest-transactions', 'guest-goals', 'guest-budget', 'guest-seeded'].forEach(
        (key) => localStorage.removeItem(key)
      );
    }
    set({ user: null, token: null, isAuthenticated: false, isGuest: false });
  },

  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}), {
  name: 'expense-rack-auth',
  partialize: (state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isGuest: state.isGuest,
  }),
}));

export default useAuthStore;
