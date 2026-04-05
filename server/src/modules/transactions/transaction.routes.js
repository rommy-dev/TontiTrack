import { Router }                  from 'express';
import { transactionController }   from './transaction.controller.js';
import { protect }                 from '../../middleware/auth.js';
import { validateBody }            from '../../middleware/validate.js';
import { z }                       from 'zod';

const router = Router();

// ── Schéma pour la correction d'erreur ───────────────────────────────────────
const correctSchema = z.object({
  // userId optionnel : si fourni, redirige la transaction vers ce user
  userId:      z.string().regex(/^[0-9a-fA-F]{24}$/, 'userId invalide').optional(),
  // amountCents optionnel : si fourni, corrige le montant
  amountCents: z.number().int().positive().optional(),
}).refine(d => d.userId || d.amountCents, {
  message: 'Fournir au moins userId ou amountCents à corriger',
});

// ── Toutes les routes transactions nécessitent d'être authentifié ─────────────
router.use(protect);

// Transactions personnelles
// GET /api/transactions/me?page=1&limit=20&type=contribution&groupId=xxx
router.get('/me', transactionController.getMyTransactions);

// Historique d'un groupe
// GET /api/transactions/group/:groupId?page=1&limit=20&type=contribution
router.get('/group/:groupId', transactionController.getGroupHistory);

// Détail d'une transaction
// GET /api/transactions/:transactionId
router.get('/:transactionId', transactionController.getById);

// Correction d'erreur (admin seulement — vérification dans le service)
// POST /api/transactions/correct/:transactionId
router.post(
  '/correct/:transactionId',
  validateBody(correctSchema),
  transactionController.correctTransaction
);

export default router;