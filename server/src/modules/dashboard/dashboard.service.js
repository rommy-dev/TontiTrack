import mongoose        from 'mongoose';
import { Contribution } from '../contributions/contribution.model.js';
import { Transaction }  from '../transactions/transaction.model.js';
import { Group }        from '../groups/group.model.js';
import { convertCents } from '../../utils/currency.js';

function sumConverted(rows, key, targetCurrency) {
  return rows.reduce(
    (sum, row) => sum + convertCents(row[key] || 0, row.currency || 'XAF', targetCurrency),
    0
  );
}

export const dashboardService = {

  // KPIs globaux du user connecté
  async getUserKpis(userId, preferredCurrency = 'XAF') {
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

      // Contributions : total dû, payé, en retard, groupés par devise du cycle
      Contribution.aggregate([
        { $match: { userId: uid } },
        {
          $lookup: {
            from: 'cycles',
            localField: 'cycleId',
            foreignField: '_id',
            as: 'cycle',
          },
        },
        { $unwind: '$cycle' },
        { $group: {
          _id:           '$cycle.currency',
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
        {
          $project: {
            _id: 0,
            currency: '$_id',
            totalExpected: 1,
            totalPaid: 1,
            countPending: 1,
            countPartial: 1,
            countLate: 1,
            countPaid: 1,
            totalLateRemaining: 1,
            totalLatePenalty: 1,
            totalPenalty: 1,
          },
        },
      ]),

      // Total transactions envoyées ce mois, groupé par devise de transaction
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
        { $group: { _id: '$currency', totalThisMonth: { $sum: '$amountCents' } } },
        { $project: { _id: 0, currency: '$_id', totalThisMonth: 1 } },
      ]),
    ]);

    const g  = groupsData[0]        ?? { total: 0, active: 0 };
    const c  = contributionsData.reduce((acc, row) => {
      acc.totalExpected += convertCents(row.totalExpected, row.currency, preferredCurrency);
      acc.totalPaid += convertCents(row.totalPaid, row.currency, preferredCurrency);
      acc.totalLateRemaining += convertCents(row.totalLateRemaining, row.currency, preferredCurrency);
      acc.totalLatePenalty += convertCents(row.totalLatePenalty, row.currency, preferredCurrency);
      acc.totalPenalty += convertCents(row.totalPenalty, row.currency, preferredCurrency);
      acc.countPending += row.countPending || 0;
      acc.countPartial += row.countPartial || 0;
      acc.countLate += row.countLate || 0;
      acc.countPaid += row.countPaid || 0;
      return acc;
    }, {
      totalExpected: 0,
      totalPaid: 0,
      countPending: 0,
      countPartial: 0,
      countLate: 0,
      countPaid: 0,
      totalLateRemaining: 0,
      totalLatePenalty: 0,
      totalPenalty: 0,
    });
    const totalThisMonth = sumConverted(transactionsData, 'totalThisMonth', preferredCurrency);

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
      thisMonth: { totalPaid: totalThisMonth },
      currency: preferredCurrency,
    };
  },

  // Collecte mensuelle sur les 6 derniers mois — pour le graphique linéaire
  async getMonthlyCollected(userId, preferredCurrency = 'XAF') {
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
            currency: '$currency',
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

      const foundRows = data.filter(
        (r) => r._id.year === year && r._id.month === month
      );

      months.push({
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        month,
        year,
        total: foundRows.reduce(
          (sum, row) => sum + convertCents(row.total || 0, row._id.currency || 'XAF', preferredCurrency),
          0
        ),
        count: foundRows.reduce((sum, row) => sum + (row.count || 0), 0),
        currency: preferredCurrency,
      });
    }

    return months;
  },

  // Répartition des statuts — pour le graphique camembert
  async getContributionStatusBreakdown(userId, preferredCurrency = 'XAF') {
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
      {
        $group: {
          _id: {
            status: '$effectiveStatus',
            currency: '$cycle.currency',
          },
          count: { $sum: 1 },
          total: { $sum: '$expectedAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const labels = {
      paid:      'Payé',
      partial:   'Partiel',
      pending:   'En attente',
      late:      'En retard',
      defaulted: 'Impayé',
    };

    const grouped = data.reduce((acc, row) => {
      const status = row._id.status;
      if (!acc[status]) {
        acc[status] = { status, count: 0, total: 0 };
      }
      acc[status].count += row.count || 0;
      acc[status].total += convertCents(row.total || 0, row._id.currency || 'XAF', preferredCurrency);
      return acc;
    }, {});

    return Object.values(grouped).map((d) => ({
      status: d.status,
      label:  labels[d.status] ?? d.status,
      count:  d.count,
      total:  d.total,
      currency: preferredCurrency,
    }));
  },

  // Dette par groupe — pour le tableau de bord
  async getDebtByGroup(userId, preferredCurrency = 'XAF') {
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

    return data.map((row) => ({
      groupId:        row.groupId,
      groupName:      row.groupName,
      currency:       preferredCurrency,
      totalExpected:  convertCents(row.totalExpected,  row.currency || 'XAF', preferredCurrency),
      totalPaid:      convertCents(row.totalPaid,      row.currency || 'XAF', preferredCurrency),
      totalRemaining: convertCents(row.totalRemaining, row.currency || 'XAF', preferredCurrency),
      totalPenalty:   convertCents(row.totalPenalty,   row.currency || 'XAF', preferredCurrency),
      countOpen:      row.countOpen,
    }));
  },
};
