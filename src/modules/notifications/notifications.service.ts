import { parsePagination, paginatedResult } from '../../common/utils';
import { notificationsRepository } from './notifications.repository';
import type { NotificationQuery } from './notifications.schemas';

export const notificationsService = {
  async getMyNotifications(userId: string, query: NotificationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const { items, total } = await notificationsRepository.findByUser(
      userId,
      skip,
      limit,
      query.unreadOnly,
    );

    return paginatedResult(items, total, page, limit);
  },

  async markAsRead(id: string, userId: string) {
    await notificationsRepository.markRead(id, userId);
  },

  async markAllAsRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
  },

  async getUnreadCount(userId: string) {
    const count = await notificationsRepository.countUnread(userId);
    return { count };
  },

  async notify(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return notificationsRepository.create({ userId, type, title, message, data });
  },
};
