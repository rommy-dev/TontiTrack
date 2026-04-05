// Un wrapper qui attrape toutes les erreurs async et les passe à next()
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};