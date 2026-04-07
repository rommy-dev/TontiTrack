import { Notification } from './notification.model.js';
import { NotFoundError, ForbiddenError } from '../../utils/ApiError.js';

export const notificationService = {

  // Créer une notification — appelé par d'autres services (contribution, cycle…)
  async create({ userId, type, title, message, link = null, meta = {} }) {
    const notif = await Notification.create({
      userId, type, title, message, link, meta,
    });
    return notif;
  },

  // Créer en masse — pour les rappels de groupe (N membres)
  async createMany(notifications) {
    return Notification.insertMany(notifications);
  },

  // Liste paginée des notifications d'un user
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { userId };
    if (unreadOnly) query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return {
      notifications,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      unreadCount,
    };
  },

  // Nombre de non-lues — appelé pour le badge de la cloche
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, read: false });
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId, userId) {
    const notif = await Notification.findById(notificationId);
    if (!notif) throw new NotFoundError('Notification');
    if (!notif.userId.equals(userId)) throw new ForbiddenError('Accès refusé');

    notif.read = true;
    await notif.save();
    return notif;
  },

  // Tout marquer comme lu
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return { updated: result.modifiedCount };
  },

  // Supprimer les notifications de plus de 30 jours — appelé par cron
  async deleteOld() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });
    return result.deletedCount;
  },
};