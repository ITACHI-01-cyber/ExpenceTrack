import { create } from 'zustand';

// In-memory auth store (no localStorage per requirements)
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}));

export default useAuthStore;
