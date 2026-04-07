import cron from 'node-cron';
import { cycleService }        from '../modules/cycles/cycle.service.js';
import { contributionService } from '../modules/contributions/contribution.service.js';
import { Contribution }        from '../modules/contributions/contribution.model.js';
import { Cycle }               from '../modules/cycles/cycle.model.js';
import { Group }               from '../modules/groups/group.model.js';
import { calculatePenalty }    from '../utils/finance.js';
import { notificationService } from '../modules/notifications/notification.service.js';

// Tourne tous les jours à 8h00
const CYCLE_CHECK_SCHEDULE    = '0 8 * * *';
// Tourne tous les jours à 8h30 (après le check des cycles)
const PENALTY_APPLY_SCHEDULE  = '30 8 * * *';
// Tourne tous les jours à 9h00 (rappels J-3)
const REMINDER_SCHEDULE       = '0 9 * * *';
// Tourne tous les jours à 10h00 (notifications de retard)
const LATE_NOTIFY_SCHEDULE    = '0 10 * * *';
// Tourne tous les jours à 3h00 (nettoyage)
const CLEANUP_SCHEDULE        = '0 3 * * *';

async function checkExpiredCycles() {
  console.log('[CRON] Vérification des cycles expirés...');
  try {
    const updated = await cycleService.checkAndUpdateCycleStatuses();
    console.log(`[CRON] ${updated} cycle(s) mis à jour`);
  } catch (err) {
    console.error('[CRON] Erreur checkExpiredCycles :', err.message);
  }
}

async function applyLatePenalties() {
  console.log('[CRON] Application des pénalités de retard...');
  try {
    const now = new Date();

    // Trouver toutes les contributions actives dont la dueDate est dépassée
    // et dont la grace period est également dépassée
    const lateCandidates = await Contribution.find({
      status: { $in: ['pending', 'partial'] },
    }).populate({
      path:  'cycleId',
      match: { status: 'active', dueDate: { $lt: now } },
    }).populate('groupId');

    // populate peut retourner des docs avec cycleId = null si le $match échoue
    const overdue = lateCandidates.filter(c => c.cycleId !== null);

    let penaltiesApplied = 0;

    for (const contribution of overdue) {
      const group = contribution.groupId;
      if (!group) continue;

      // Vérifier que la grace period est dépassée
      const graceLimit = new Date(contribution.cycleId.dueDate);
      graceLimit.setDate(graceLimit.getDate() + group.settings.gracePeriodDays);

      if (now <= graceLimit) continue; // encore dans la grace period

      const penalty = calculatePenalty({
        expectedAmount: contribution.expectedAmount,
        paidAmount:     contribution.paidAmount,
        penaltyRate:    group.settings.penaltyRate,
      });

      if (penalty > 0) {
        await Contribution.findByIdAndUpdate(contribution._id, {
          $set: {
            status:        'late',
            penaltyAmount: penalty,
          },
        });
        penaltiesApplied++;
      }
    }

    console.log(`[CRON] ${penaltiesApplied} pénalité(s) appliquée(s)`);
  } catch (err) {
    console.error('[CRON] Erreur applyLatePenalties :', err.message);
  }
}

// ── Rappels J-3 avant échéance ────────────────────────────────────────────────
async function sendUpcomingReminders() {
  console.log('[CRON] Envoi des rappels J-3...');
  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(23, 59, 59, 999);

    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() + 3);
    startOfDay.setHours(0, 0, 0, 0);

    // Contributions pending/partial dont l'échéance est dans 3 jours pile
    const upcoming = await Contribution.find({
      status:  { $in: ['pending', 'partial'] },
    }).populate({
      path:  'cycleId',
      match: {
        status:  'active',
        dueDate: { $gte: startOfDay, $lte: targetDate },
      },
    }).populate('groupId', 'name settings.currency');

    const toNotify = upcoming.filter((c) => c.cycleId !== null);

    const notifs = toNotify.map((c) => ({
      userId:  c.userId,
      type:    'payment_reminder',
      title:   'Rappel de paiement',
      message: `Votre contribution pour "${c.groupId?.name}" est due dans 3 jours. Restant : ${((c.expectedAmount - c.paidAmount) / 100).toLocaleString('fr-FR')} ${c.groupId?.settings?.currency ?? 'XAF'}.`,
      link:    '/contributions',
      meta: {
        groupId:        c.groupId?._id,
        cycleId:        c.cycleId?._id,
        contributionId: c._id,
        amountCents:    c.expectedAmount - c.paidAmount,
        currency:       c.groupId?.settings?.currency,
        groupName:      c.groupId?.name,
      },
    }));

    if (notifs.length > 0) {
      await notificationService.createMany(notifs);
    }

    console.log(`[CRON] ${notifs.length} rappel(s) J-3 envoyé(s)`);
  } catch (err) {
    console.error('[CRON] Erreur sendUpcomingReminders :', err.message);
  }
}

// ── Notifications de retard ───────────────────────────────────────────────────
async function notifyLateContributions() {
  console.log('[CRON] Notification des retards...');
  try {
    // Contributions qui viennent de passer à "late" aujourd'hui
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lateToday = await Contribution.find({
      status:    'late',
      updatedAt: { $gte: today, $lt: tomorrow },
    }).populate('groupId', 'name settings');

    const notifs = lateToday.map((c) => ({
      userId:  c.userId,
      type:    'payment_late',
      title:   'Paiement en retard',
      message: `Votre contribution pour "${c.groupId?.name}" est en retard. Une pénalité de ${(c.groupId?.settings?.penaltyRate ?? 0.05) * 100}% s'applique.`,
      link:    '/contributions',
      meta: {
        groupId:        c.groupId?._id,
        contributionId: c._id,
        amountCents:    c.penaltyAmount,
        currency:       c.groupId?.settings?.currency,
        groupName:      c.groupId?.name,
      },
    }));

    if (notifs.length > 0) {
      await notificationService.createMany(notifs);
    }

    console.log(`[CRON] ${notifs.length} notification(s) de retard créée(s)`);
  } catch (err) {
    console.error('[CRON] Erreur notifyLateContributions :', err.message);
  }
}

// ── Nettoyage des vieilles notifications ──────────────────────────────────────
async function cleanOldNotifications() {
  console.log('[CRON] Nettoyage des notifications...');
  try {
    const deleted = await notificationService.deleteOld();
    console.log(`[CRON] ${deleted} notification(s) supprimée(s)`);
  } catch (err) {
    console.error('[CRON] Erreur cleanOldNotifications :', err.message);
  }
}

export function startCronJobs() {
  // En développement, on peut tester manuellement plutôt que d'attendre 8h
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON] Jobs planifiés (dev : exécution immédiate + schedule)');
    checkExpiredCycles();
    applyLatePenalties();
  }

  // Cycles et pénalités (existants)
  cron.schedule(CYCLE_CHECK_SCHEDULE,   checkExpiredCycles);
  cron.schedule(PENALTY_APPLY_SCHEDULE, applyLatePenalties);

  // Rappels et notifications (nouveaux)
  cron.schedule(REMINDER_SCHEDULE,    sendUpcomingReminders);   // J-3 à 9h
  cron.schedule(LATE_NOTIFY_SCHEDULE,  notifyLateContributions); // retards à 10h
  cron.schedule(CLEANUP_SCHEDULE,     cleanOldNotifications);   // nettoyage à 3h

  console.log('[CRON] 5 jobs planifiés');
}