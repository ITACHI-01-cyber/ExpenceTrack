import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeTheme = (theme) => (
  theme === 'dark' || theme === 'midnight-dark' ? 'dark' : 'light'
);

const useAppearanceStore = create(persist(
  (set) => ({
    theme: 'light',
    glass: false,
    setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
    setGlass: (glass) => set({ glass }),
  }),
  {
    name: 'expense-rack-appearance',
    version: 1,
    migrate: (state) => ({
      ...state,
      theme: normalizeTheme(state?.theme),
    }),
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState,
      theme: normalizeTheme(persistedState?.theme ?? currentState.theme),
    }),
    partialize: ({ theme, glass }) => ({ theme, glass }),
  }
));

export default useAppearanceStore;
