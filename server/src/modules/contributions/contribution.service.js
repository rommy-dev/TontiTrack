import mongoose from 'mongoose';
import { Contribution } from './contribution.model.js';
import { Transaction  } from '../transactions/transaction.model.js';
import { Cycle        } from '../cycles/cycle.model.js';
import { Group        } from '../groups/group.model.js';
import { deriveContributionStatus, calculatePenalty } from '../../utils/finance.js';
import {
  NotFoundError, ForbiddenError, ValidationError
} from '../../utils/ApiError.js';
import { notificationService } from '../notifications/notification.service.js';
import { _createPayoutTransaction } from '../cycles/cycle.service.js';

export const contributionService = {

  async recordPayment({ contributionId, payerId, amountCents }) {
    if (amountCents <= 0) {
      throw new ValidationError('Le montant doit être positif');
    }

    const contribution = await Contribution.findById(contributionId);
    if (!contribution) throw new NotFoundError('Contribution');

    // Seul le membre concerné peut enregistrer son paiement
    if (!contribution.userId.equals(payerId)) {
      throw new ForbiddenError('Vous ne pouvez payer que vos propres contributions');
    }
    if (contribution.status === 'paid') {
      throw new ValidationError('Cette contribution est déjà entièrement payée');
    }

    const cycle = await Cycle.findById(contribution.cycleId);
    const group = await Group.findById(contribution.groupId);

    const PAYABLE_CYCLE_STATUSES = ['active', 'pending'];

    if (!PAYABLE_CYCLE_STATUSES.includes(cycle.status)) {
      throw new ValidationError(
        `Impossible d'enregistrer un paiement : le cycle #${cycle.cycleNumber} ` +
        `est actuellement "${cycle.status}". ` +
        `Les paiements ne sont acceptés que pour les cycles actifs.`
      );
    }

    // Vérifier qu'on ne dépasse pas le montant dû
    const remaining = contribution.expectedAmount - contribution.paidAmount;
    if (amountCents > remaining) {
      throw new ValidationError(
        `Montant trop élevé. Il reste ${remaining} centimes à payer.`
      );
    }
    if (!group.settings.allowPartialPay && amountCents < remaining) {
      throw new ValidationError('Ce groupe n\'accepte pas les paiements partiels');
    }

    // ─── Calcul du statut et de la pénalité éventuelle ───────────────────────
    const newPaidAmount = contribution.paidAmount + amountCents;

    const graceLimit = new Date(cycle.dueDate);
    graceLimit.setDate(graceLimit.getDate() + group.settings.gracePeriodDays);
    const isAfterGrace = new Date() > graceLimit;

    const newStatus = deriveContributionStatus({
      paidAmount:      newPaidAmount,
      expectedAmount:  contribution.expectedAmount,
      dueDate:         cycle.dueDate,
      gracePeriodDays: group.settings.gracePeriodDays,
    });

    const penalty = isAfterGrace
      ? (contribution.penaltyAmount || calculatePenalty({
        expectedAmount: contribution.expectedAmount,
        paidAmount:     contribution.paidAmount,
        penaltyRate:    group.settings.penaltyRate,
      }))
      : 0;

    // ─── Session MongoDB : Contribution + Transaction en une seule opération ─
    const session = await mongoose.startSession();
    let committed = false;

    try {
      session.startTransaction();

      // 1. Créer la Transaction (journal immuable)
      const [transaction] = await Transaction.create([{
        groupId:     contribution.groupId,
        userId:      payerId,
        type:        'contribution',
        amountCents,
        currency:    cycle.currency,
        referenceId: contributionId,
        description: `Cotisation cycle #${cycle.cycleNumber}`,
      }], { session });

      // 2. Mettre à jour la Contribution avec $inc atomique
      await Contribution.findByIdAndUpdate(
        contributionId,
        {
          $inc:  { paidAmount: amountCents },  // atomique — pas de race condition
          $set:  { status: newStatus, penaltyAmount: penalty },
          $push: { transactionIds: transaction._id },
        },
        { session }
      );

      // 3. Si une pénalité s'applique, créer une Transaction séparée
      if (penalty > 0) {
        const existingPenaltyTransaction = await Transaction.findOne({
          groupId:     contribution.groupId,
          userId:      payerId,
          type:        'penalty',
          referenceId: contributionId,
        }).session(session);

        if (!existingPenaltyTransaction) {
          const [penaltyTransaction] = await Transaction.create([{
            groupId:     contribution.groupId,
            userId:      payerId,
            type:        'penalty',
            amountCents: penalty,
            currency:    cycle.currency,
            referenceId: contributionId,
            description: `Pénalité de retard cycle #${cycle.cycleNumber}`,
          }], { session });

          await Contribution.findByIdAndUpdate(
            contributionId,
            { $push: { transactionIds: penaltyTransaction._id } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      committed = true;

      // Notification de confirmation (hors session — pas critique)
      await notificationService.create({
        userId:  payerId,
        type:    'payment_confirmed',
        title:   'Paiement confirmé',
        message: `Votre paiement de ${amountCents / 100} ${cycle.currency} a été enregistré pour le cycle #${cycle.cycleNumber}.`,
        link:    `/contributions`,
        meta: {
          groupId:        contribution.groupId,
          cycleId:        contribution.cycleId,
          contributionId: contributionId,
          amountCents,
          currency:       cycle.currency,
        },
      });

      // Vérifier si tous les membres ont payé → compléter le cycle
      // Fait hors session — pas critique si ça échoue (le cron job corrigera)
      await this._tryCompleteCycle(contribution.cycleId);

      return { success: true, newStatus, amountPaid: amountCents, penalty };

    } catch (err) {
      if (!committed) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Vérifie si toutes les contributions d'un cycle sont payées
  async _tryCompleteCycle(cycleId) {
    console.log(`🔍 Vérification completion cycle ${cycleId}`);
    const unpaid = await Contribution.countDocuments({
      cycleId,
      status: { $nin: ['paid'] },
    });
    console.log(`📊 Contributions non payées: ${unpaid}`);
    
    if (unpaid === 0) {
      console.log(`✅ Toutes les contributions payées, completion du cycle ${cycleId}`);
      await Cycle.findByIdAndUpdate(cycleId, { status: 'completed' });

      const completedCycle = await Cycle.findById(cycleId);
      console.log(`🏆 Cycle complété:`, { 
        cycleId, 
        beneficiaryId: completedCycle?.beneficiaryId,
        cycleNumber: completedCycle?.cycleNumber 
      });
      
      if (completedCycle?.beneficiaryId) {
        console.log(`💰 Création du versement pour le bénéficiaire ${completedCycle.beneficiaryId}`);
        await _createPayoutTransaction(completedCycle);
      } else {
        console.log(`⚠️ Cycle ${cycleId} complété mais pas de bénéficiaire défini`);
      }
    } else {
      console.log(`⏳ Cycle ${cycleId} pas encore complété (${unpaid} contributions en attente)`);
    }
  },

  // Récupérer toutes les contributions d'un user avec agrégation
  async getUserContributions(userId, filters = {}) {
    const query = { userId, ...filters };
    return Contribution.find(query)
      .populate('cycleId', 'cycleNumber startDate dueDate status')
      .populate('groupId', 'name currency')
      .sort({ createdAt: -1 });
  },

  // Dashboard : résumé des dettes en cours pour un groupe
  async getGroupDebtSummary(groupId, requestingUserId) {
    const group = await Group.findById(groupId);
    if (!group?.hasMember(requestingUserId)) throw new ForbiddenError('Accès refusé');

    // Aggregation pipeline : calculs lourds côté MongoDB, pas Node.js
    const summary = await Contribution.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId), status: { $ne: 'paid' } } },
      {
        $group: {
          _id:            '$userId',
          totalExpected:  { $sum: '$expectedAmount' },
          totalPaid:      { $sum: '$paidAmount' },
          totalRemaining: { $sum: { $subtract: ['$expectedAmount', '$paidAmount'] } },
          pendingCount:   { $sum: 1 },
        },
      },
      { $sort: { totalRemaining: -1 } },
    ]);

    return summary;
  },
};
