import mongoose        from 'mongoose';
import { Transaction } from './transaction.model.js';
import { Contribution } from '../contributions/contribution.model.js';
import { Group }        from '../groups/group.model.js';
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

  // Transactions personnelles du user connecté
  async getUserTransactions(userId, { page = 1, limit = 20, type, groupId } = {}) {
    const query = { userId };
    if (type)    query.type    = type;
    if (groupId) query.groupId = groupId;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('groupId', 'name settings.currency')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  // Détail d'une transaction unique avec vérification d'accès
  async getById(transactionId, requestingUserId) {
    const transaction = await Transaction.findById(transactionId)
      .populate('userId',  'firstName lastName email')
      .populate('groupId', 'name');

    if (!transaction) throw new NotFoundError('Transaction');

    // L'utilisateur doit être membre du groupe OU être l'auteur de la transaction
    const group = await Group.findById(transaction.groupId);
    const isMember  = group?.hasMember(requestingUserId);
    const isAuthor  = transaction.userId._id.equals(requestingUserId);

    if (!isMember && !isAuthor) throw new ForbiddenError('Accès refusé');

    return transaction;
  },

  // Correction d'erreur
  async correctTransaction({ wrongTransactionId, adminId, correctedData }) {
    const wrong = await Transaction.findById(wrongTransactionId);
    if (!wrong) throw new NotFoundError('Transaction');

    const group = await Group.findById(wrong.groupId);
    if (!group?.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');

    const hoursSinceCreation = (Date.now() - wrong.createdAt) / 3600000;
    if (hoursSinceCreation > 24) {
      throw new ValidationError(
        'Impossible de corriger une transaction de plus de 24h. Créez un remboursement manuel.'
      );
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const [refund] = await Transaction.create([{
        groupId:     wrong.groupId,
        userId:      wrong.userId,
        type:        'refund',
        amountCents: -wrong.amountCents,
        currency:    wrong.currency,
        referenceId: wrong._id,
        description: `Annulation transaction ${wrong._id} — correction admin`,
      }], { session });

      const [corrected] = await Transaction.create([{
        groupId:     wrong.groupId,
        userId:      correctedData.userId || wrong.userId,
        type:        wrong.type,
        amountCents: correctedData.amountCents || wrong.amountCents,
        currency:    wrong.currency,
        referenceId: wrong.referenceId,
        description: `Correction de ${wrong._id} par admin`,
      }], { session });

      if (wrong.referenceId && wrong.type === 'contribution') {
        await Contribution.findByIdAndUpdate(
          wrong.referenceId,
          {
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