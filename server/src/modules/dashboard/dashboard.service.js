import mongoose        from 'mongoose';
import { Contribution } from '../contributions/contribution.model.js';
import { Transaction }  from '../transactions/transaction.model.js';
import { Group }        from '../groups/group.model.js';
import { Cycle }        from '../cycles/cycle.model.js';

export const dashboardService = {

  // KPIs globaux du user connecté
  async getUserKpis(userId) {
    const uid = new mongoose.Types.ObjectId(userId);

    const [
      groupsData,
      contributionsData,
      transactionsData,
    ] = await Promise.all([

      // Groupes actifs et total
      Group.aggregate([
        { $match: { 'members.userId': uid, 'members.status': 'active' } },
        { $group: {
          _id:    null,
          total:  { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        }},
      ]),

      // Contributions : total dû, payé, en retard
      Contribution.aggregate([
        { $match: { userId: uid } },
        { $group: {
          _id:          null,
          totalExpected: { $sum: '$expectedAmount' },
          totalPaid:     { $sum: '$paidAmount' },
          countPending:  { $sum: { $cond: [{ $eq: ['$status', 'pending']  }, 1, 0] } },
          countPartial:  { $sum: { $cond: [{ $eq: ['$status', 'partial']  }, 1, 0] } },
          countLate:     { $sum: { $cond: [{ $eq: ['$status', 'late']     }, 1, 0] } },
          countPaid:     { $sum: { $cond: [{ $eq: ['$status', 'paid']     }, 1, 0] } },
          totalLateRemaining: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'late'] },
                { $subtract: ['$expectedAmount', '$paidAmount'] },
                0,
              ],
            },
          },
          totalLatePenalty: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'late'] },
                '$penaltyAmount',
                0,
              ],
            },
          },
          totalPenalty:  { $sum: '$penaltyAmount' },
        }},
      ]),

      // Total transactions envoyées ce mois
      Transaction.aggregate([
        {
          $match: {
            userId:    uid,
            type:      'contribution',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, totalThisMonth: { $sum: '$amountCents' } } },
      ]),
    ]);

    const g  = groupsData[0]        ?? { total: 0, active: 0 };
    const c  = contributionsData[0] ?? {
      totalExpected: 0, totalPaid: 0,
      countPending: 0, countPartial: 0, countLate: 0, countPaid: 0,
      totalLateRemaining: 0, totalLatePenalty: 0, totalPenalty: 0,
    };
    const tx = transactionsData[0]  ?? { totalThisMonth: 0 };

    const totalOpen      = c.countPending + c.countPartial + c.countLate;
    const completionRate = totalOpen + c.countPaid > 0
      ? Math.round((c.countPaid / (totalOpen + c.countPaid)) * 100)
      : 0;

    return {
      groups:         { total: g.total, active: g.active },
      contributions:  {
        totalExpected:  c.totalExpected,
        totalPaid:      c.totalPaid,
        totalRemaining: Math.max(0, c.totalExpected - c.totalPaid),
        totalLateRemaining: c.totalLateRemaining,
        totalLatePenalty:   c.totalLatePenalty,
        totalPenalty:   c.totalPenalty,
        countPending:   c.countPending,
        countPartial:   c.countPartial,
        countLate:      c.countLate,
        countPaid:      c.countPaid,
        completionRate,
      },
      thisMonth: { totalPaid: tx.totalThisMonth },
    };
  },

  // Collecte mensuelle sur les 6 derniers mois — pour le graphique linéaire
  async getMonthlyCollected(userId) {
    const uid     = new mongoose.Types.ObjectId(userId);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Transaction.aggregate([
      {
        $match: {
          userId:    uid,
          type:      'contribution',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$amountCents' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Remplir les mois manquants avec 0
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d    = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;

      const found = data.find(
        (r) => r._id.year === year && r._id.month === month
      );

      months.push({
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        month,
        year,
        total: found?.total ?? 0,
        count: found?.count ?? 0,
      });
    }

    return months;
  },

  // Répartition des statuts — pour le graphique camembert
  async getContributionStatusBreakdown(userId) {
    const uid = new mongoose.Types.ObjectId(userId);

    const data = await Contribution.aggregate([
      { $match: { userId: uid } },
      {
        $lookup: {
          from:         'cycles',
          localField:   'cycleId',
          foreignField: '_id',
          as:           'cycle',
        },
      },
      { $unwind: '$cycle' },
      {
        $addFields: {
          effectiveStatus: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'paid'] },
                  { $lt: ['$paidAmount', '$expectedAmount'] },
                  { $eq: ['$cycle.status', 'failed'] },
                ],
              },
              'defaulted',
              '$status',
            ],
          },
        },
      },
      { $group: { _id: '$effectiveStatus', count: { $sum: 1 }, total: { $sum: '$expectedAmount' } } },
      { $sort: { count: -1 } },
    ]);

    const labels = {
      paid:      'Payé',
      partial:   'Partiel',
      pending:   'En attente',
      late:      'En retard',
      defaulted: 'Impayé',
    };

    return data.map((d) => ({
      status: d._id,
      label:  labels[d._id] ?? d._id,
      count:  d.count,
      total:  d.total,
    }));
  },

  // Dette par groupe — pour le tableau de bord
  async getDebtByGroup(userId) {
    const uid = new mongoose.Types.ObjectId(userId);

    const data = await Contribution.aggregate([
      {
        $match: {
          userId: uid,
          status: { $nin: ['paid'] },
        },
      },
      {
        $lookup: {
          from:         'cycles',
          localField:   'cycleId',
          foreignField: '_id',
          as:           'cycle',
        },
      },
      { $unwind: '$cycle' },
      {
        $match: {
          'cycle.status': { $ne: 'failed' },
        },
      },
      {
        $group: {
          _id:            '$groupId',
          totalExpected:  { $sum: '$expectedAmount' },
          totalPaid:      { $sum: '$paidAmount' },
          totalRemaining: {
            $sum: { $subtract: ['$expectedAmount', '$paidAmount'] },
          },
          totalPenalty:   { $sum: '$penaltyAmount' },
          countOpen:      { $sum: 1 },
        },
      },
      {
        $lookup: {
          from:         'groups',
          localField:   '_id',
          foreignField: '_id',
          as:           'group',
        },
      },
      { $unwind: '$group' },
      {
        $project: {
          groupId:        '$_id',
          groupName:      '$group.name',
          currency:       '$group.settings.currency',
          totalExpected:  1,
          totalPaid:      1,
          totalRemaining: 1,
          totalPenalty:   1,
          countOpen:      1,
        },
      },
      { $sort: { totalRemaining: -1 } },
    ]);

    return data;
  },
};
