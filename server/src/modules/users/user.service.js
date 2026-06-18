import { User }        from './user.model.js';
import { NotFoundError, ForbiddenError, ValidationError, AuthError } from '../../utils/ApiError.js';

export const userService = {

  // Récupérer son propre profil
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('Utilisateur');
    if (user.status === 'banned') throw new AuthError('Compte suspendu');
    return user.toPublicJSON();
  },

  // Mettre à jour les infos du profil (PAS le mot de passe — route séparée)
  async updateProfile(userId, updates) {
    // Champs autorisés explicitement — whitelist stricte
    // On n'accepte jamais passwordHash, status, ou refreshTokens via cette route
    const allowed = ['firstName', 'lastName', 'phone', 'preferredCurrency', 'avatar'];
    const sanitized = {};

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        sanitized[key] = updates[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      throw new ValidationError('Aucun champ valide à mettre à jour');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: sanitized },
      { new: true, runValidators: true } // runValidators : applique les contraintes Mongoose
    );

    if (!user) throw new NotFoundError('Utilisateur');
    return user.toPublicJSON();
  },

  // Changer l'email — vérification séparée car plus sensible
  async updateEmail(userId, { newEmail, password }) {
    // Récupère le hash pour vérifier le mot de passe avant de changer l'email
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('Utilisateur');

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new AuthError('Mot de passe incorrect');

    // Vérifier unicité — on laisse l'index gérer le cas de conflit (E11000)
    // L'errorHandler transformera l'erreur 11000 en ConflictError 409
    user.email = newEmail.toLowerCase().trim();
    await user.save();

    return user.toPublicJSON();
  },

  // Changer le mot de passe
  async updatePassword(userId, { currentPassword, newPassword }) {
    if (currentPassword === newPassword) {
      throw new ValidationError('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    const user = await User.findById(userId).select('+passwordHash +refreshTokens');
    if (!user) throw new NotFoundError('Utilisateur');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new AuthError('Mot de passe actuel incorrect');

    // Le pre('save') hook de user.model.js hashera automatiquement
    user.passwordHash = newPassword;

    // Révoquer tous les refresh tokens existants — force la reconnexion sur tous les appareils
    // C'est une bonne pratique de sécurité après un changement de mot de passe
    user.refreshTokens = [];

    await user.save();
    return { message: 'Mot de passe mis à jour. Reconnectez-vous sur tous vos appareils.' };
  },

  // Désactiver son propre compte (soft delete)
  async deactivateAccount(userId, { password }) {
    const user = await User.findById(userId).select('+passwordHash +refreshTokens');
    if (!user) throw new NotFoundError('Utilisateur');

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new AuthError('Mot de passe incorrect');

    user.status = 'inactive';
    user.refreshTokens = [];  // révoque toutes les sessions
    await user.save();

    return { message: 'Compte désactivé' };
  },

  // Récupérer un autre utilisateur par email (pour l'ajout dans un groupe)
  // Retourne seulement les infos publiques minimales
  async findByEmail(email) {
    const user = await User.findOne({
      email:  email.toLowerCase().trim(),
      status: 'active',
    }).select('firstName lastName email');

    if (!user) throw new NotFoundError('Utilisateur');
    return user;
  },

  // Mettre à jour la photo de profil (avatar) et supprimer l'ancien fichier
  async updateAvatar(userId, filename) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('Utilisateur');

    const oldAvatar = user.avatar;
    user.avatar = filename;
    await user.save();

    // Supprimer l'ancien avatar s'il existe pour économiser de l'espace disque
    if (oldAvatar) {
      const fs = await import('fs');
      const path = await import('path');
      const oldPath = path.join('uploads', oldAvatar);
      fs.promises.unlink(oldPath).catch((err) => {
        console.error(`Impossible de supprimer l'ancien avatar (${oldAvatar}) :`, err.message);
      });
    }

    return user.toPublicJSON();
  },
};