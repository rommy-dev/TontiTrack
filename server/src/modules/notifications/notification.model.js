import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'payment_reminder',   // rappel avant échéance
      'payment_late',       // paiement en retard
      'payment_confirmed',  // confirmation de paiement
      'cycle_started',      // nouveau cycle créé
      'cycle_completed',    // cycle terminé
      'payout_received',    // versement reçu par le bénéficiaire
      'member_joined',      // nouveau membre dans le groupe
      'penalty_applied',    // pénalité appliquée
      'admin_role_transferred', // rôle admin transféré (ancien admin)
      'admin_role_received',    // rôle admin reçu (nouveau admin)
      'group_paused',       // groupe mis en pause
      'group_reactivated',  // groupe réactivé
      'group_completed',    // groupe archivé
    ],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false, index: true },

  // Lien vers la ressource concernée — pour la navigation au clic
  link:    { type: String, default: null },

  // Métadonnées contextuelles — montant, groupe, cycle…
  meta: {
    groupId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Group',   default: null },
    cycleId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle',   default: null },
    contributionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contribution', default: null },
    amountCents:    { type: Number, default: null },
    currency:       { type: String, default: null },
    groupName:      { type: String, default: null },
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }, // immuable comme Transaction
});

// Index composé pour "mes notifications non lues" — requête la plus fréquente
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);