// src/app.js  — VERSION FINALE
import 'dotenv/config';
import './config/env.js';
import express              from 'express';
import cors                 from 'cors';
import helmet               from 'helmet';
import morgan               from 'morgan';
import cookieParser         from 'cookie-parser'; 
import { connectDB, closeDB } from './config/db.js';
import { errorHandler }     from './middleware/errorHandler.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';

import authRoutes         from './modules/auth/auth.routes.js';
import userRoutes         from './modules/users/user.routes.js';
import groupRoutes        from './modules/groups/group.routes.js';
import cycleRoutes        from './modules/cycles/cycle.routes.js';
import contributionRoutes from './modules/contributions/contribution.routes.js';
import transactionRoutes  from './modules/transactions/transaction.routes.js';
import { startCronJobs }  from './jobs/cycleStatusJob.js';

const app = express();

// ── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,   // nécessaire pour les cookies cross-origin
}));
app.use(apiRateLimiter);   // limite globale sur tout l'API

// ── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());    // pour lire req.cookies.refreshToken

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRateLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/groups',        groupRoutes);

// Routes cycles imbriquées sous groups : /api/groups/:groupId/cycles
app.use('/api/groups/:groupId/cycles', cycleRoutes);

app.use('/api/contributions',  contributionRoutes);
app.use('/api/transactions',   transactionRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    env:      process.env.NODE_ENV,
    uptime:   Math.floor(process.uptime()),
    mongodb:  require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.originalUrl} introuvable` });
});

// ── Error handler — TOUJOURS EN DERNIER ──────────────────────────────────────
app.use(errorHandler);

// ── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur TontiTrack sur le port ${PORT} [${process.env.NODE_ENV}]`);
      startCronJobs();  // démarre les jobs planifiés
    });
  });
}

// ── Fermeture propre (Ctrl+C, redéploiement Docker) ──────────────────────────
const shutdown = async (signal) => {
  console.log(`\nSignal ${signal} reçu — fermeture propre...`);
  await closeDB();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Bugs non catchés — on log et on sort proprement
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection :', err);
  shutdown('unhandledRejection');
});

export default app;