import mongoose from 'mongoose';
import { config } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDB(retries = MAX_RETRIES) {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      // Ces options évitent les warnings de dépréciation et optimisent le pool
      maxPoolSize:       10,   // nb de connexions simultanées max
      serverSelectionTimeoutMS: 5000,  // timeout si MongoDB ne répond pas
      socketTimeoutMS:   45000,
    });
    console.log(`MongoDB connecté : ${conn.connection.host}`);

    // Événements de cycle de vie — essentiels pour monitorer en production
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB déconnecté — tentative de reconnexion automatique...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnecté');
    });
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB :', err.message);
    });

  } catch (err) {
    console.error(`Connexion MongoDB échouée (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}) : ${err.message}`);

    if (retries > 1) {
      console.log(`Nouvelle tentative dans ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    // Plus de tentatives — on ne peut pas démarrer sans DB dans une app financière
    console.error('Impossible de se connecter à MongoDB. Arrêt du serveur.');
    process.exit(1);
  }
}

// Fermeture propre lors d'un arrêt du process (Ctrl+C, kill, redéploiement)
export async function closeDB() {
  await mongoose.connection.close();
  console.log('Connexion MongoDB fermée proprement');
}
