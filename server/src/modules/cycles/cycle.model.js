import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
  groupId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group',  required: true, index: true },
  cycleNumber:   { type: Number, required: true },
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   default: null },
  targetAmount:  { type: Number, required: true },    // snapshot en centimes
  currency:      { type: String, required: true },    // snapshot de settings.currency
  startDate:     { type: Date, required: true },
  dueDate:       { type: Date, required: true },
  status: {
    type:    String,
    enum:    ['pending', 'active', 'completed', 'failed'],
    default: 'pending',
  },
  // Snapshot des montants attendus par membre au moment de la création
  // Utile si contributionMode = 'custom'
  memberAmounts: [{
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expectedAmount: { type: Number, required: true },  // en centimes
    _id: false,
  }],
}, { timestamps: true });

// Index composé unique : un seul cycleNumber par groupe
cycleSchema.index({ groupId: 1, cycleNumber: 1 }, { unique: true });
cycleSchema.index({ status: 1, dueDate: 1 });  // pour le cron job qui vérifie les expirations

export const Cycle = mongoose.model('Cycle', cycleSchema);