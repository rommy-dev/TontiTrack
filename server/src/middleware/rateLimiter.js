import rateLimit from 'express-rate-limit';

// Limite stricte pour les routes d'authentification
// Protège contre le brute-force de mots de passe
export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // fenêtre de 15 minutes
  max:             10,               // max 10 tentatives par IP par fenêtre
  standardHeaders: true,             // headers RateLimit-* dans la réponse
  legacyHeaders:   false,
  message: {
    status:  'error',
    message: 'Trop de tentatives. Réessayez dans 15 minutes.',
  },
  // En test, on désactive pour ne pas bloquer les tests d'intégration
  skip: () => process.env.NODE_ENV === 'test',
});

// Limite générale pour toutes les routes API
export const apiRateLimiter = rateLimit({
  windowMs:        60 * 1000,   // 1 minute
  max:             100,          // 100 requêtes par IP par minute
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    status:  'error',
    message: 'Trop de requêtes. Ralentissez.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// Limite pour les opérations financières sensibles (créer un paiement)
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  message: {
    status:  'error',
    message: 'Trop d\'opérations financières. Attendez une minute.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
