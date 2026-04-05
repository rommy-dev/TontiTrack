import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  groupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  type:        { type: String, enum: ['contribution', 'penalty', 'payout', 'refund'], required: true },
  amountCents: { type: Number, required: true },  // négatif pour refund
  currency:    { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID de la Contribution liée
  description: { type: String, maxlength: 200 },
  // PAS de updatedAt — signal intentionnel d'immuabilité
}, { timestamps: { createdAt: true, updatedAt: false } });

transactionSchema.index({ groupId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);