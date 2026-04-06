import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isAuth:      false,

      setAuth({ user, accessToken }) {
        set({ user, accessToken, isAuth: true });
      },

      updateUser(updates) {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      clearAuth() {
        set({ user: null, accessToken: null, isAuth: false });
      },
    }),
    {
      name: 'tontitrack-auth',
      // Ne persiste que le user — le token est en mémoire volatile
      // (le refresh token est dans le cookie httpOnly, géré par le navigateur)
      partialize: (state) => ({ user: state.user, isAuth: state.isAuth }),
    }
  )
);