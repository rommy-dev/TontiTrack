import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Détecte la préférence système au premier chargement
const systemPrefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// Applique ou retire la classe 'dark' sur <html>
const applyTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // null = suit le système, 'light' ou 'dark' = choix explicite
      theme: null,

      // Dérivé : true si le mode sombre est actif
      get isDark() {
        const { theme } = get();
        return theme === null ? systemPrefersDark() : theme === 'dark';
      },

      // Bascule explicite
      toggle() {
        const current = get().isDark;
        const next = !current;
        set({ theme: next ? 'dark' : 'light' });
        applyTheme(next);
      },

      // Revenir au système
      resetToSystem() {
        set({ theme: null });
        applyTheme(systemPrefersDark());
      },

      // Initialisation au boot — appelée dans main.jsx
      init() {
        const { theme } = get();
        if (theme === null) {
          applyTheme(systemPrefersDark());
          // Écouter les changements de préférence système en temps réel
          window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) => {
              if (get().theme === null) applyTheme(e.matches);
            });
        } else {
          applyTheme(theme === 'dark');
        }
      },
    }),
    {
      name:    'tontitrack-theme',   // clé localStorage
      partialize: (state) => ({ theme: state.theme }), // persiste seulement `theme`
    }
  )
);