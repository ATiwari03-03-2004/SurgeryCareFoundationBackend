import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, validate } from '../../common/middleware';
import { notificationQuerySchema } from './notifications.schemas';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: notificationQuerySchema }),
  notificationsController.getMyNotifications,
);

router.get('/unread-count', notificationsController.getUnreadCount);

router.patch('/:id/read', notificationsController.markAsRead);

router.patch('/read-all', notificationsController.markAllAsRead);

export { router as notificationRoutes };
