import { prisma } from '../../config/database';
import type { Prisma } from '@prisma/client';

export interface NotificationCreateData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export const notificationsRepository = {
  create(data: NotificationCreateData) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as Prisma.InputJsonValue,
      },
    });
  },

  async findByUser(userId: string, skip: number, take: number, unreadOnly?: boolean) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (unreadOnly) {
      where.readAt = null;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total };
  },

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  },
};
