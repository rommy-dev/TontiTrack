import { exportService } from './export.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { User }          from '../users/user.model.js';

async function getPreferredCurrency(userId) {
  const user = await User.findById(userId).select('preferredCurrency');
  return user?.preferredCurrency || 'XAF';
}

export const exportController = {
  downloadCyclePdf: catchAsync(async (req, res) => {
    const preferredCurrency = await getPreferredCurrency(req.user._id); 
    await exportService.generateCyclePdf({
      groupId: req.query.groupId,
      cycleId: req.params.cycleId,
      userId: req.user._id,
      preferredCurrency,
      res,
    });
  }),

  downloadGroupExcel: catchAsync(async (req, res) => {
    await exportService.generateTransactionExcel({
      groupId: req.params.groupId,
      userId: req.user._id,
      res,
    });
  }),
};
