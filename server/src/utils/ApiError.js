export class ApiError extends Error {
  constructor(statusCode, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.details   = details;  // erreurs de validation détaillées
    this.isOperational = true; // distingue les erreurs prévues des bugs
  }
}

// Les sous-classes nomment explicitement le type d'erreur
export class ValidationError extends ApiError {
  constructor(message, details) { super(400, message, details); }
}
export class AuthError extends ApiError {
  constructor(message = 'Non authentifié') { super(401, message); }
}
export class ForbiddenError extends ApiError {
  constructor(message = 'Accès refusé') { super(403, message); }
}
export class NotFoundError extends ApiError {
  constructor(resource = 'Ressource') { super(404, `${resource} introuvable`); }
}
export class ConflictError extends ApiError {
  constructor(message) { super(409, message); }
}