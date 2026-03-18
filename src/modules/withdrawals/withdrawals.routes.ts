import { Router } from 'express';
import { withdrawalsController } from './withdrawals.controller';
import { authenticate, requirePermission, validate } from '../../common/middleware';
import { Permission } from '../../config/constants';
import { createWithdrawalSchema, withdrawalQuerySchema } from './withdrawals.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  requirePermission(Permission.WITHDRAWAL_REQUEST_OWN),
  validate({ body: createWithdrawalSchema }),
  withdrawalsController.create,
);

router.get(
  '/me',
  validate({ query: withdrawalQuerySchema }),
  withdrawalsController.getMyWithdrawals,
);

router.get(
  '/:id',
  withdrawalsController.getById,
);

router.get(
  '/campaign/:campaignId',
  withdrawalsController.getCampaignWithdrawals,
);

router.get(
  '/campaign/:campaignId/balance',
  withdrawalsController.getCampaignBalance,
);

export { router as withdrawalRoutes };
