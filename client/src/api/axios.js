import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,   // envoie le cookie refreshToken automatiquement
  headers:         { 'Content-Type': 'application/json' },
});

// ── Intercepteur de requête : injecter l'access token ────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Intercepteur de réponse : rafraîchir le token si expiré ─────────────────
let isRefreshing  = false;
let failedQueue   = [];  // requêtes en attente pendant le refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Token expiré et pas encore tenté de refresh
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Une autre requête est déjà en train de rafraîchir — mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry   = true;
      isRefreshing      = true;

      try {
        // Le cookie refreshToken est envoyé automatiquement (withCredentials)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;
        useAuthStore.getState().setAuth({
          user:        useAuthStore.getState().user,
          accessToken: newToken,
        });

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);

      } catch (refreshError) {
        // Refresh échoué — déconnecter l'utilisateur
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;