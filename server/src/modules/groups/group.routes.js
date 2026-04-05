import { Router } from 'express';
import { groupController } from './group.controller.js';
import { protect } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createGroupSchema, addMemberSchema } from './group.validation.js';

const router = Router();

// Toutes les routes groups nécessitent d'être authentifié
router.use(protect);

router.post('/',                      validateBody(createGroupSchema), groupController.create);
router.get('/',                                                        groupController.getMyGroups);
router.get('/:groupId',                                                groupController.getById);
router.post('/:groupId/members',      validateBody(addMemberSchema),   groupController.addMember);
router.delete('/:groupId/members/:memberId',                           groupController.removeMember);
router.patch('/:groupId/activate',                                     groupController.activate);

export default router;