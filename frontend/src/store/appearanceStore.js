import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppearanceStore = create(persist(
  (set) => ({
    theme: 'light',
    glass: false,
    setTheme: (theme) => set({ theme }),
    setGlass: (glass) => set({ glass }),
  }),
  {
    name: 'expense-rack-appearance',
    partialize: ({ theme, glass }) => ({ theme, glass }),
  }
));

export default useAppearanceStore;
