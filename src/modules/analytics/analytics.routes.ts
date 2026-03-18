import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requirePermission, validate } from '../../common/middleware';
import { Permission } from '../../config/constants';
import { dashboardQuerySchema, analyticsQuerySchema } from './analytics.schemas';

const router = Router();

router.use(authenticate);
router.use(requirePermission(Permission.ANALYTICS_VIEW_ADMIN));

router.get(
  '/dashboard',
  validate({ query: dashboardQuerySchema }),
  analyticsController.getDashboard,
);

router.get(
  '/donations',
  validate({ query: analyticsQuerySchema }),
  analyticsController.getDonationAnalytics,
);

router.get(
  '/campaigns',
  validate({ query: analyticsQuerySchema }),
  analyticsController.getCampaignAnalytics,
);

export { router as analyticsRoutes };
