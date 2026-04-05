import { ValidationError } from '../utils/ApiError.js';

// Prend un schema Zod, retourne un middleware Express
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError('Données invalides', details);
  }
  req.body = result.data; // remplace req.body par les données validées et transformées
  next();
};