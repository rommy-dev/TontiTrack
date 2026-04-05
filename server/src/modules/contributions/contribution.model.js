import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  cycleId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle',  required: true },
  groupId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Group',  required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  expectedAmount: { type: Number, required: true },   // centimes, snapshot
  paidAmount:     { type: Number, default: 0 },       // centimes, cumulatif
  penaltyAmount:  { type: Number, default: 0 },       // centimes
  status: {
    type:    String,
    enum:    ['pending', 'partial', 'paid', 'late', 'defaulted'],
    default: 'pending',
  },
  transactionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
}, { timestamps: true });

// Un seul doc de contribution par membre par cycle
contributionSchema.index({ cycleId: 1, userId: 1 }, { unique: true });
contributionSchema.index({ groupId: 1, status: 1 });   // "toutes les contributions en retard du groupe X"
contributionSchema.index({ userId: 1, cycleId: 1 });   // "toutes mes contributions"

export const Contribution = mongoose.model('Contribution', contributionSchema);