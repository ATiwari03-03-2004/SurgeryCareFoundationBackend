import { Router } from 'express';
import { campaignsController } from './campaigns.controller';
import { authenticate, optionalAuth, validate, requirePermission } from '../../common/middleware';
import { Permission } from '../../config/constants';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignQuerySchema,
  campaignUpdateSchema,
  campaignMilestoneSchema,
} from './campaigns.schemas';

const router = Router();

// Public routes
const publicRouter = Router();
publicRouter.get('/', validate({ query: campaignQuerySchema }), campaignsController.listPublic);
publicRouter.get('/:slug', campaignsController.getPublicBySlug);
publicRouter.get('/:slug/updates', validate({ query: campaignQuerySchema }), campaignsController.getPublicUpdates);

// Authenticated campaign creator routes
const creatorRouter = Router();
creatorRouter.use(authenticate);

creatorRouter.post(
  '/',
  requirePermission(Permission.CAMPAIGN_CREATE),
  validate({ body: createCampaignSchema }),
  campaignsController.create
);

creatorRouter.get('/me', campaignsController.getMy);

creatorRouter.get('/:id', campaignsController.getById);

creatorRouter.patch(
  '/:id',
  requirePermission(Permission.CAMPAIGN_UPDATE_OWN),
  validate({ body: updateCampaignSchema }),
  campaignsController.update
);

creatorRouter.post(
  '/:id/submit',
  requirePermission(Permission.CAMPAIGN_SUBMIT_OWN),
  campaignsController.submit
);

creatorRouter.post(
  '/:id/updates',
  validate({ body: campaignUpdateSchema }),
  campaignsController.addUpdate
);

creatorRouter.post(
  '/:id/milestones',
  validate({ body: campaignMilestoneSchema }),
  campaignsController.addMilestone
);

export { publicRouter as publicCampaignRoutes, creatorRouter as campaignRoutes };
