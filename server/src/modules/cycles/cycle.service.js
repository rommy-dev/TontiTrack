// src/modules/cycles/cycle.service.js
import mongoose from 'mongoose';
import { Cycle }        from './cycle.model.js';
import { Group }        from '../groups/group.model.js';
import { Contribution } from '../contributions/contribution.model.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/ApiError.js';
import { notificationService } from '../notifications/notification.service.js';

export const cycleService = {

  async createCycle({ groupId, adminId, beneficiaryId, startDate, dueDate }) {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.isAdmin(adminId)) throw new ForbiddenError('Action réservée à l\'admin');
    if (group.status !== 'active') {
      throw new ValidationError('Le groupe doit être actif pour créer un cycle');
    }

    // Vérifier qu'il n'y a pas déjà un cycle actif ou en attente
    const openCycle = await Cycle.findOne({
      groupId,
      status: { $in: ['pending', 'active'] },
    });
    if (openCycle) {
      throw new ValidationError('Un cycle est déjà en cours. Clôturez-le avant d\'en créer un nouveau.');
    }

    // Numéro séquentiel automatique
    const lastCycle = await Cycle.findOne({ groupId }).sort({ cycleNumber: -1 });
    const cycleNumber = (lastCycle?.cycleNumber ?? 0) + 1;

    const activeMembers = group.members.filter(m => m.status === 'active');

    // Snapshot du targetAmount total
    const targetAmount = group.settings.targetAmount;

    // Snapshot des montants individuels
    const memberAmounts = activeMembers.map(m => ({
      userId:         m.userId,
      expectedAmount: group.getMemberContribution(m.userId),
    }));

    // ─── Session MongoDB pour atomicité ──────────────────────────────────────
    // On crée le Cycle ET toutes les Contributions en une seule transaction.
    // Si l'une échoue, tout est annulé.
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const [cycle] = await Cycle.create([{
        groupId,
        cycleNumber,
        beneficiaryId: beneficiaryId || null,
        targetAmount,
        currency:    group.settings.currency,
        startDate:   new Date(startDate),
        dueDate:     new Date(dueDate),
        status:      'active',
        memberAmounts,
      }], { session });

      // Créer une Contribution "pending" pour chaque membre actif
      const contributions = activeMembers.map(m => ({
        cycleId:        cycle._id,
        groupId,
        userId:         m.userId,
        expectedAmount: group.getMemberContribution(m.userId),
        paidAmount:     0,
        penaltyAmount:  0,
        status:         'pending',
        transactionIds: [],
      }));

      await Contribution.insertMany(contributions, { session });

      await session.commitTransaction();

      // Notifier tous les membres actifs du nouveau cycle
      const notifs = activeMembers.map((m) => ({
        userId:  m.userId,
        type:    'cycle_started',
        title:   'Nouveau cycle démarré',
        message: `Le cycle #${cycleNumber} de "${group.name}" a démarré. Échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}.`,
        link:    `/groups/${groupId}`,
        meta: {
          groupId,
          cycleId:   cycle._id,
          currency:  group.settings.currency,
          groupName: group.name,
        },
      }));
      await notificationService.createMany(notifs);

      return cycle;

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getCycleWithContributions(cycleId, requestingUserId) {
    const cycle = await Cycle.findById(cycleId)
      .populate('beneficiaryId', 'firstName lastName');
    if (!cycle) throw new NotFoundError('Cycle');

    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findById(cycle.groupId);
    if (!group.hasMember(requestingUserId)) throw new ForbiddenError('Accès refusé');

    const contributions = await Contribution.find({ cycleId })
      .populate('userId', 'firstName lastName email');

    return { cycle, contributions };
  },

  async getGroupCycles(groupId, requestingUserId) {
    // Vérifier que l'utilisateur est membre du groupe
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError('Groupe');
    if (!group.hasMember(requestingUserId)) throw new ForbiddenError('Accès refusé');

    const cycles = await Cycle.find({ groupId })
      .populate('beneficiaryId', 'firstName lastName')
      .sort({ cycleNumber: 1 });

    return cycles;
  },

  // Appelé par le cron job chaque jour
  async checkAndUpdateCycleStatuses() {
    const now = new Date();

    // Cycles dont la dueDate est dépassée et encore actifs
    const expiredCycles = await Cycle.find({
      status: 'active',
      dueDate: { $lt: now },
    });

    for (const cycle of expiredCycles) {
      const unpaidCount = await Contribution.countDocuments({
        cycleId: cycle._id,
        status:  { $nin: ['paid'] },
      });

      cycle.status = unpaidCount === 0 ? 'completed' : 'failed';
      await cycle.save();
    }

    return expiredCycles.length;
  },
};