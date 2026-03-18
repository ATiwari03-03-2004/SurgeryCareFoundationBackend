import { Router } from 'express';
import { donationsController } from './donations.controller';
import { authenticate, validate } from '../../common/middleware';
import { createDonationSchema, donationQuerySchema } from './donations.schemas';

const router = Router();
const publicRouter = Router();

// Public route - campaign donations (anonymous-safe)
publicRouter.get(
  '/campaign/:campaignId',
  validate({ query: donationQuerySchema }),
  donationsController.getCampaignDonations,
);

// Authenticated routes
router.use(authenticate);

router.post(
  '/',
  validate({ body: createDonationSchema }),
  donationsController.create,
);

router.get(
  '/me',
  validate({ query: donationQuerySchema }),
  donationsController.getMyDonations,
);

router.get(
  '/:id',
  donationsController.getById,
);

export { router as donationRoutes, publicRouter as publicDonationRoutes };
