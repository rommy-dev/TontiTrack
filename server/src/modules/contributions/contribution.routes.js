import { Router } from 'express';
import { contributionController } from './contribution.controller.js';
import { protect }                from '../../middleware/auth.js';
import { paymentRateLimiter }     from '../../middleware/rateLimiter.js';
import { validateBody }           from '../../middleware/validate.js';
import { z }                      from 'zod';

const router = Router();

const paymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
});

router.use(protect);

// Route de paiement avec son propre rate limiter
router.post(
  '/:contributionId/pay',
  paymentRateLimiter,
  validateBody(paymentSchema),
  contributionController.recordPayment
);
router.get('/me',                                 contributionController.getMyContributions);
router.get('/group/:groupId/summary',             contributionController.getGroupDebtSummary);
router.get('/:contributionId',                    contributionController.getById);

export default router;