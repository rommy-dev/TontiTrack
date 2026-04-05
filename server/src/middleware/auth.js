import jwt from 'jsonwebtoken';
import { User } from '../modules/users/user.model.js';
import { AuthError, NotFoundError, ForbiddenError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { config } from '../config/env.js';

// Middleware qui protège n'importe quelle route
export const protect = catchAsync(async (req, res, next) => {
  // 1. Récupérer le token dans le header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Token manquant');
  }
  const token = authHeader.split(' ')[1];

  // 2. Vérifier et décoder le token
  let payload;
  try {
    payload = jwt.verify(token, config.jwtAccessSecret);
  } catch {
    throw new AuthError('Token invalide ou expiré');
  }

  if (payload.type !== 'access') throw new AuthError('Token invalide');

  // 3. Vérifier que l'utilisateur existe encore et n'est pas banni
  const user = await User.findById(payload.sub).select('status firstName lastName email');
  if (!user) throw new AuthError('Utilisateur introuvable');
  if (user.status === 'banned') throw new AuthError('Compte suspendu');

  // 4. Injecter l'utilisateur dans req — disponible dans tous les handlers suivants
  req.user = user;
  next();
});

// Middleware qui vérifie qu'un user est admin d'un groupe
// Utilisé comme : router.delete('/:id', protect, requireGroupAdmin, ...)
export const requireGroupAdmin = catchAsync(async (req, res, next) => {
  const { Group } = await import('../modules/groups/group.model.js');
  const group = await Group.findById(req.params.groupId);
  if (!group) throw new NotFoundError('Groupe');

  const member = group.members.find(m => m.userId.equals(req.user._id));
  if (!member || member.role !== 'admin') {
    throw new ForbiddenError('Action réservée à l\'admin du groupe');
  }
  req.group = group;   // disponible pour le controller
  next();
});