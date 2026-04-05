import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { startCronJobs } from './jobs/cycleStatusJob.js';

const PORT = process.env.PORT || 5000;

// ── Démarrage ────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Serveur TontiTrack sur le port ${PORT} [${process.env.NODE_ENV}]`);
      startCronJobs();  // démarre les jobs planifiés
    });

    // ── Fermeture propre (Ctrl+C, redéploiement Docker) ──────────────────────
    const shutdown = async (signal) => {
      console.log(`\nSignal ${signal} reçu — fermeture propre...`);
      await closeDB();
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Bugs non catchés — on log et on sort proprement
    process.on('unhandledRejection', (err) => {
      console.error('unhandledRejection :', err);
      shutdown('unhandledRejection');
    });

  } catch (err) {
    console.error('Erreur au démarrage du serveur :', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}