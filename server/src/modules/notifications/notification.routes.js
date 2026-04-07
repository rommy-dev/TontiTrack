import { Router }                  from 'express';
import { notificationController }  from './notification.controller.js';
import { protect }                 from '../../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/',                     notificationController.getAll);
router.get('/unread-count',         notificationController.getUnreadCount);
router.patch('/read-all',           notificationController.markAllAsRead);
router.patch('/:id/read',           notificationController.markAsRead);

export default router;