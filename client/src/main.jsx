import React        from 'react';
import ReactDOM     from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster }  from 'react-hot-toast';
import App          from './App.jsx';
import { useThemeStore } from './store/themeStore.js';
import './index.css';

// Initialiser le thème avant le premier rendu — évite le flash FOUC
useThemeStore.getState().init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Pas de refetch automatique sur focus fenêtre — comportement trop agressif
      // pour une app financière (l'utilisateur peut laisser l'onglet ouvert longtemps)
      refetchOnWindowFocus: false,
      retry:                1,
      staleTime:            1000 * 60 * 2,  // 2 minutes avant de considérer les données périmées
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize:     '14px',
            borderRadius: '8px',
            // Les toasts s'adaptent automatiquement au mode sombre via CSS vars
            background: 'var(--color-bg)',
            color:      'var(--color-text-primary)',
            border:     '1px solid var(--color-border)',
            boxShadow:  '0 4px 12px rgb(0 0 0 / 0.10)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);