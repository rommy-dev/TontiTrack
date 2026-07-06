import jwt    from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User }   from '../users/user.model.js';
import { config } from '../../config/env.js';
import { AuthError, ConflictError } from '../../utils/ApiError.js';

const generateTokens = (userId) => {
  const accessJti = randomUUID();
  const refreshJti = randomUUID();

  const accessToken = jwt.sign(
    { sub: userId.toString(), type: 'access', jti: accessJti },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpires }
  );
  const refreshToken = jwt.sign(
    { sub: userId.toString(), type: 'refresh', jti: refreshJti },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpires }
  );
  return { accessToken, refreshToken };
};

export const authService = {

  async register({ firstName, lastName, email, password }) {
    // Hashage explicite ici
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Pas de "check then save" : l'index unique MongoDB gère l'unicité atomiquement.
    // L'errorHandler transforme l'erreur E11000 en ConflictError 409.
    const user = new User({ firstName, lastName, email, passwordHash });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Stocker le refresh token en base pour permettre la révocation
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  async login({ email, password }) {
    // select('+passwordHash +refreshTokens') : récupère les champs exclus par défaut
    const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');

    // Message volontairement ambigu — ne jamais préciser "email inconnu" ou "mauvais mdp"
    // (user enumeration attack)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AuthError('Email ou mot de passe incorrect');
    }

    if (user.status === 'banned') {
      throw new AuthError('Compte suspendu. Contactez le support.');
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  async refreshAccessToken(incomingRefreshToken) {
    let payload;
    try {
      payload = jwt.verify(incomingRefreshToken, config.jwtRefreshSecret);
    } catch {
      throw new AuthError('Refresh token invalide ou expiré');
    }

    if (payload.type !== 'refresh') throw new AuthError('Token invalide');

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
      // Réutilisation suspecte : révoquer tous les tokens du compte
      if (user) {
        await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
      }
      throw new AuthError('Session invalide. Reconnectez-vous.');
    }

    // Rotation : supprimer l'ancien, émettre un nouveau
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Modifier le tableau en mémoire
    const updatedTokens = user.refreshTokens.filter(t => t !== incomingRefreshToken);
    updatedTokens.push(refreshToken);

    // Mettre à jour avec $set (pas de conflit)
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: updatedTokens } });

    return { accessToken, refreshToken };
  },

  async logout(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  },
};