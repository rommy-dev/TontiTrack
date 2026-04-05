import jwt from 'jsonwebtoken';
import { User } from '../users/user.model.js';
import { config } from '../../config/env.js';
import { AuthError, ConflictError, ValidationError } from '../../utils/ApiError.js';

// Génère une paire access + refresh token
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpires }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpires }
  );
  return { accessToken, refreshToken };
};

export const authService = {

  async register({ firstName, lastName, email, password }) {
    // Pas de "check then save" — on laisse l'index unique gérer ça
    // L'errorHandler transformera l'erreur 11000 en ConflictError 409
    const user = new User({
      firstName,
      lastName,
      email,
      passwordHash: password,   // le pre('save') hook hashera automatiquement
    });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Stocker le refresh token hashé en base (révocable)
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  async login({ email, password }) {
    // select('+passwordHash') : récupère le hash qu'on avait exclu par défaut
    const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');

    // Comparaison en temps constant — résiste aux timing attacks
    if (!user || !(await user.comparePassword(password))) {
      // Message volontairement ambigu — ne pas dire "email inconnu" ou "mauvais mdp"
      throw new AuthError('Email ou mot de passe incorrect');
    }

    if (user.status === 'banned') {
      throw new AuthError('Compte suspendu. Contactez le support.');
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

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
      // Token révoqué ou réutilisation suspecte — invalider tous les tokens
      if (user) { user.refreshTokens = []; await user.save(); }
      throw new AuthError('Session invalide. Reconnectez-vous.');
    }

    // Rotation : supprimer l'ancien, émettre un nouveau
    user.refreshTokens = user.refreshTokens.filter(t => t !== incomingRefreshToken);
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
  },

  async logout(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken }
    });
  },
};