import { Router } from 'express';
import { cycleController } from './cycle.controller.js';
import { protect }         from '../../middleware/auth.js';
import { validateBody }    from '../../middleware/validate.js';
import { z }               from 'zod';

const router = Router({ mergeParams: true }); // mergeParams = accès à :groupId du parent

const createCycleSchema = z.object({
  beneficiaryId: z.string().optional(),
  startDate:     z.string().datetime(),
  dueDate:       z.string().datetime(),
}).refine(d => new Date(d.dueDate) > new Date(d.startDate), {
  message: 'dueDate doit être après startDate',
});

router.use(protect);

router.post('/',         validateBody(createCycleSchema), cycleController.create);
router.get('/',                                           cycleController.getGroupCycles);
router.get('/:cycleId',                                   cycleController.getWithContributions);

export default router;