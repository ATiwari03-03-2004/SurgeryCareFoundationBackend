import { Router } from 'express';
import { moderationController } from './moderation.controller';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { Role } from '../../config/constants';
import {
  approveCampaignSchema,
  rejectCampaignSchema,
  requestChangesSchema,
  verifyDocumentSchema,
  rejectDocumentSchema,
  moderationQuerySchema,
} from './moderation.schemas';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.MODERATOR, Role.SUPER_ADMIN));

// Campaign moderation routes
router.get(
  '/campaigns',
  validate({ query: moderationQuerySchema }),
  moderationController.listPendingCampaigns,
);

router.get(
  '/campaigns/:id',
  moderationController.getCampaignForReview,
);

router.post(
  '/campaigns/:id/approve',
  validate({ body: approveCampaignSchema }),
  moderationController.approveCampaign,
);

router.post(
  '/campaigns/:id/reject',
  validate({ body: rejectCampaignSchema }),
  moderationController.rejectCampaign,
);

router.post(
  '/campaigns/:id/request-changes',
  validate({ body: requestChangesSchema }),
  moderationController.requestChanges,
);

// Document moderation routes
router.post(
  '/documents/:id/verify',
  validate({ body: verifyDocumentSchema }),
  moderationController.verifyDocument,
);

router.post(
  '/documents/:id/reject',
  validate({ body: rejectDocumentSchema }),
  moderationController.rejectDocument,
);

export { router as moderationRoutes };
