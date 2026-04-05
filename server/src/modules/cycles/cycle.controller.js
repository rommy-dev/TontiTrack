import { cycleService } from './cycle.service.js';
import { catchAsync }   from '../../utils/catchAsync.js';

export const cycleController = {

  create: catchAsync(async (req, res) => {
    const { beneficiaryId, startDate, dueDate } = req.body;
    const cycle = await cycleService.createCycle({
      groupId:       req.params.groupId,
      adminId:       req.user._id,
      beneficiaryId,
      startDate,
      dueDate,
    });
    res.status(201).json({ status: 'success', data: { cycle } });
  }),

  getWithContributions: catchAsync(async (req, res) => {
    const data = await cycleService.getCycleWithContributions(
      req.params.cycleId,
      req.user._id
    );
    res.json({ status: 'success', data });
  }),

  getGroupCycles: catchAsync(async (req, res) => {
    const cycles = await cycleService.getGroupCycles(
      req.params.groupId,
      req.user._id
    );
    res.json({ status: 'success', results: cycles.length, data: { cycles } });
  }),
};