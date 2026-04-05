import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // 1. Normaliser en ApiError si ce n'en est pas une
  let error = err;

  if (!(err instanceof ApiError)) {
    // Erreur Mongoose : document not found
    if (err.name === 'CastError') {
      error = new ApiError(400, `ID invalide : ${err.value}`);
    }
    // Erreur Mongoose : index unique violé (email déjà pris)
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      error = new ApiError(409, `${field} déjà utilisé`);
    }
    // Erreur Mongoose : validation du schéma
    else if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => e.message);
      error = new ApiError(400, 'Données invalides', details);
    }
    // JWT expiré
    else if (err.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Session expirée, reconnectez-vous');
    }
    // JWT malformé
    else if (err.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Token invalide');
    }
    // Bug non prévu — erreur 500 générique
    else {
      error = new ApiError(500, 'Erreur interne du serveur');
    }
  }

  // 2. Logger (toujours, même en prod)
  if (error.statusCode >= 500) {
    console.error('ERROR 500:', err); // En prod : remplacer par Sentry/Datadog
  }

  // 3. Répondre
  const response = {
    status:  'error',
    message: error.message,
  };

  // En développement : exposer les détails du bug
  if (config.isDevelopment) {
    response.stack   = err.stack;
    response.details = error.details;
  }

  // En production : exposer seulement les détails de validation (safe)
  if (config.isProduction && error.details?.length) {
    response.details = error.details;
  }

  res.status(error.statusCode).json(response);
};