import { Router } from 'express';
import { exportController } from './export.controller.js';
import { protect } from '../../middleware/auth.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(protect);
router.use(apiRateLimiter);

router.get('/cycles/:cycleId/pdf', exportController.downloadCyclePdf);
router.get('/groups/:groupId/excel', exportController.downloadGroupExcel);

export default router;
