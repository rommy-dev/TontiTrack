import { ValidationError } from '../utils/ApiError.js';

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error?.errors?.map(
      e => `${e.path.join('.') || 'root'}: ${e.message}`
    ) || ['Validation échouée'];

    return next(new ValidationError('Données invalides', details));
  }

  // Remplace req.body par les données validées, transformées et nettoyées par Zod
  req.body = result.data;
  next();
};