import { notificationService } from './notification.service.js';
import { catchAsync }          from '../../utils/catchAsync.js';

export const notificationController = {

  // GET /api/notifications
  getAll: catchAsync(async (req, res) => {
    const { page, limit, unread } = req.query;

    const data = await notificationService.getUserNotifications(
      req.user._id,
      {
        page:       Math.max(1, parseInt(page) || 1),
        limit:      Math.min(50, parseInt(limit) || 20),
        unreadOnly: unread === 'true',
      }
    );

    res.json({ status: 'success', data });
  }),

  // GET /api/notifications/unread-count
  getUnreadCount: catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ status: 'success', data: { count } });
  }),

  // PATCH /api/notifications/:id/read
  markAsRead: catchAsync(async (req, res) => {
    const notif = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );
    res.json({ status: 'success', data: { notification: notif } });
  }),

  // PATCH /api/notifications/read-all
  markAllAsRead: catchAsync(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({ status: 'success', data: result });
  }),
};