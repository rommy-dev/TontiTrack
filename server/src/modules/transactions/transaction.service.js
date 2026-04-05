import mongoose      from 'mongoose';
import { Transaction } from './transaction.model.js';
import { Contribution } from '../contributions/contribution.model.js';
import { Group }       from '../groups/group.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/ApiError.js';

export const transactionService = {

  // Historique paginé d'un groupe
  async getGroupHistory(groupId, requestingUserId, { page = 1, limit = 20, type } = {}) {
    const group = await Group.findById(groupId);
    if (!group?.hasMember(requestingUserId)) throw new ForbiddenError('Accès refusé');

    const query = { groupId };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Correction d'erreur : annulation + recréation
  // Seul un admin peut corriger une transaction
  async correctTransaction({ wrongTransactionId, adminId, correctedData }) {
    const wrong = await Transaction.findById(wrongTransactionId);
    if (!wrong) throw new NotFoundError('Transaction');

    const group = await Group.findById(wrong.groupId);
    if (!group?.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');

    // On ne peut corriger que les transactions récentes (ex : moins de 24h)
    const hoursSinceCreation = (Date.now() - wrong.createdAt) / 3600000;
    if (hoursSinceCreation > 24) {
      throw new ValidationError(
        'Impossible de corriger une transaction de plus de 24h. Créez un remboursement manuel.'
      );
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Transaction d'annulation (montant négatif = crédit)
      const [refund] = await Transaction.create([{
        groupId:     wrong.groupId,
        userId:      wrong.userId,
        type:        'refund',
        amountCents: -wrong.amountCents,
        currency:    wrong.currency,
        referenceId: wrong._id,
        description: `Annulation de la transaction ${wrong._id} — correction admin`,
      }], { session });

      // 2. Nouvelle transaction correcte
      const [corrected] = await Transaction.create([{
        groupId:     wrong.groupId,
        userId:      correctedData.userId || wrong.userId,
        type:        wrong.type,
        amountCents: correctedData.amountCents || wrong.amountCents,
        currency:    wrong.currency,
        referenceId: wrong.referenceId,
        description: `Correction de ${wrong._id} par admin`,
      }], { session });

      // 3. Mettre à jour la Contribution liée pour refléter la correction
      if (wrong.referenceId && wrong.type === 'contribution') {
        await Contribution.findByIdAndUpdate(
          wrong.referenceId,
          {
            // Retirer l'ancienne transaction, ajouter refund + corrected
            $pull: { transactionIds: wrong._id },
            $push: { transactionIds: { $each: [refund._id, corrected._id] } },
          },
          { session }
        );
      }

      await session.commitTransaction();
      return { refund, corrected };

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};