import { Router }               from 'express';
import { dashboardController }  from './dashboard.controller.js';
import { protect }              from '../../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/kpis',             dashboardController.getKpis);
router.get('/monthly',          dashboardController.getMonthlyChart);
router.get('/status-breakdown', dashboardController.getStatusBreakdown);
router.get('/debt-by-group',    dashboardController.getDebtByGroup);

export default router;