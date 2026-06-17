import { dashboardService } from './dashboard.service.js';
import { catchAsync }       from '../../utils/catchAsync.js';
import { User }             from '../users/user.model.js';

async function getPreferredCurrency(userId) {
  const user = await User.findById(userId).select('preferredCurrency');
  return user?.preferredCurrency || 'XAF';
}

export const dashboardController = {

  getKpis: catchAsync(async (req, res) => {
    const currency = await getPreferredCurrency(req.user._id);
    const data = await dashboardService.getUserKpis(req.user._id, currency);
    res.json({ status: 'success', data });
  }),

  getMonthlyChart: catchAsync(async (req, res) => {
    const currency = await getPreferredCurrency(req.user._id);
    const data = await dashboardService.getMonthlyCollected(req.user._id, currency);
    res.json({ status: 'success', data });
  }),

  getStatusBreakdown: catchAsync(async (req, res) => {
    const currency = await getPreferredCurrency(req.user._id);
    const data = await dashboardService.getContributionStatusBreakdown(req.user._id, currency);
    res.json({ status: 'success', data });
  }),

  getDebtByGroup: catchAsync(async (req, res) => {
    const currency = await getPreferredCurrency(req.user._id);
    const data = await dashboardService.getDebtByGroup(req.user._id, currency);
    res.json({ status: 'success', data });
  }),
};
