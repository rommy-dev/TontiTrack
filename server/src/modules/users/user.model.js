import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName:         { type: String, required: true, trim: true },
  lastName:          { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:      { type: String, required: true, select: false },
  phone:             { type: String, trim: true },
  preferredCurrency: { type: String, default: 'XAF' },
  status:            { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
  refreshTokens:     [{ type: String, select: false }],
}, { timestamps: true });

// Virtuel : calculé, jamais stocké en base
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Méthode d'instance : compare un mot de passe clair au hash stocké
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(candidatePassword, this.passwordHash);
};

// Retourne uniquement les champs publics — jamais passwordHash ni refreshTokens
userSchema.methods.toPublicJSON = function () {
  return {
    id:                this._id,
    firstName:         this.firstName,
    lastName:          this.lastName,
    email:             this.email,
    phone:             this.phone,
    preferredCurrency: this.preferredCurrency,
    status:            this.status,
    createdAt:         this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);