import type { Response, NextFunction } from 'express';
import { sendSuccess, sendNoContent } from '../../common/utils';
import { notificationsService } from './notifications.service';
import type { AuthenticatedRequest } from '../../common/types';

export const notificationsController = {
  async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.getMyNotifications(req.user!.id, req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.getUnreadCount(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAsRead(req.params.id as string, req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAllAsRead(req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
