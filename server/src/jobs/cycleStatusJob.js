import cron from 'node-cron';
import { cycleService }        from '../modules/cycles/cycle.service.js';
import { contributionService } from '../modules/contributions/contribution.service.js';
import { Contribution }        from '../modules/contributions/contribution.model.js';
import { Cycle }               from '../modules/cycles/cycle.model.js';
import { Group }               from '../modules/groups/group.model.js';
import { calculatePenalty }    from '../utils/finance.js';

// Tourne tous les jours à 8h00
const CYCLE_CHECK_SCHEDULE    = '0 8 * * *';
// Tourne tous les jours à 8h30 (après le check des cycles)
const PENALTY_APPLY_SCHEDULE  = '30 8 * * *';

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

export function startCronJobs() {
  // En développement, on peut tester manuellement plutôt que d'attendre 8h
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON] Jobs planifiés (dev : exécution immédiate + schedule)');
    checkExpiredCycles();
    applyLatePenalties();
  }

  cron.schedule(CYCLE_CHECK_SCHEDULE,   checkExpiredCycles);
  cron.schedule(PENALTY_APPLY_SCHEDULE, applyLatePenalties);
  console.log('[CRON] Jobs démarrés — check à 8h00, pénalités à 8h30');
}