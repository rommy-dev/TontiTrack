import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../../config/env.js';

const userSchema = new mongoose.Schema({
  firstName:         { type: String, required: true, trim: true },
  lastName:          { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:      { type: String, required: true, select: false }, // JAMAIS retourné par défaut
  phone:             { type: String, trim: true },
  preferredCurrency: { type: String, default: 'XAF' },
  status:            { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
  refreshTokens:     [{ type: String, select: false }],  // stocke les refresh tokens valides
}, { timestamps: true });

// Virtuel : nom complet calculé, pas stocké en base
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hook pré-save : hashe le mot de passe UNIQUEMENT s'il a changé
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcryptRounds);
  next();
});

// Méthode d'instance : compare un mot de passe clair au hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Ne jamais retourner passwordHash et refreshTokens dans les réponses
userSchema.methods.toPublicJSON = function () {
  return {
    id:                this._id,
    firstName:         this.firstName,
    lastName:          this.lastName,
    fullName:          this.fullName,
    email:             this.email,
    preferredCurrency: this.preferredCurrency,
    status:            this.status,
    createdAt:         this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);