import { dashboardService } from './dashboard.service.js';
import { catchAsync }       from '../../utils/catchAsync.js';

export const dashboardController = {

  getKpis: catchAsync(async (req, res) => {
    const data = await dashboardService.getUserKpis(req.user._id);
    res.json({ status: 'success', data });
  }),

  getMonthlyChart: catchAsync(async (req, res) => {
    const data = await dashboardService.getMonthlyCollected(req.user._id);
    res.json({ status: 'success', data });
  }),

  getStatusBreakdown: catchAsync(async (req, res) => {
    const data = await dashboardService.getContributionStatusBreakdown(req.user._id);
    res.json({ status: 'success', data });
  }),

  getDebtByGroup: catchAsync(async (req, res) => {
    const data = await dashboardService.getDebtByGroup(req.user._id);
    res.json({ status: 'success', data });
  }),
};