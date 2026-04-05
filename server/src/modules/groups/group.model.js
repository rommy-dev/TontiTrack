import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:               { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt:           { type: Date, default: Date.now },
  status:             { type: String, enum: ['active', 'left', 'expelled'], default: 'active' },
  contributionAmount: { type: Number, default: null }, // null = utilise settings.targetAmount
}, { _id: false }); // pas de _id par membre — inutile ici

const groupSettingsSchema = new mongoose.Schema({
  targetAmount:      { type: Number, required: true },       // en centimes
  contributionMode:  { type: String, enum: ['equal', 'custom'], default: 'equal' },
  frequency:         { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'monthly' },
  penaltyRate:       { type: Number, default: 0.05 },        // 5% du montant dû
  gracePeriodDays:   { type: Number, default: 3 },           // jours avant pénalité
  allowPartialPay:   { type: Boolean, default: true },
  currency:          { type: String, default: 'XAF' },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  type:        { type: String, enum: ['tontine', 'caisse', 'epargne'], required: true },
  settings:    { type: groupSettingsSchema, required: true },
  members:     { type: [memberSchema], default: [] },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status:      { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
}, { timestamps: true });

// Index pour "trouver tous les groupes d'un user" — requête fréquente
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdBy: 1, status: 1 });

// ─── Méthodes d'instance ─────────────────────────────────────────────────────

// Vérifie si un userId est membre actif
groupSchema.methods.hasMember = function (userId) {
  return this.members.some(
    m => m.userId.equals(userId) && m.status === 'active'
  );
};

// Vérifie si un userId est admin
groupSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    m => m.userId.equals(userId) && m.role === 'admin' && m.status === 'active'
  );
};

// Retourne le montant attendu pour un userId donné
groupSchema.methods.getMemberContribution = function (userId) {
  const member = this.members.find(m => m.userId.equals(userId));
  if (!member) return null;
  // Mode custom : montant individuel, sinon division égale
  if (this.settings.contributionMode === 'custom' && member.contributionAmount !== null) {
    return member.contributionAmount;
  }
  const activeCount = this.members.filter(m => m.status === 'active').length;
  return Math.floor(this.settings.targetAmount / activeCount); // entier, en centimes
};

export const Group = mongoose.model('Group', groupSchema);