import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { Role } from '../../config/constants';
import {
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  disburseSchema,
  financeQuerySchema,
  reconciliationQuerySchema,
} from './finance.schemas';

const router = Router();

// All routes require authentication + finance role
router.use(authenticate);
router.use(requireRole(Role.FINANCE_MANAGER, Role.SUPER_ADMIN));

router.get(
  '/donations',
  validate({ query: financeQuerySchema }),
  financeController.getAllDonations,
);

router.get(
  '/withdrawals',
  validate({ query: financeQuerySchema }),
  financeController.getWithdrawals,
);

router.post(
  '/withdrawals/:id/approve',
  validate({ body: approveWithdrawalSchema }),
  financeController.approveWithdrawal,
);

router.post(
  '/withdrawals/:id/reject',
  validate({ body: rejectWithdrawalSchema }),
  financeController.rejectWithdrawal,
);

router.post(
  '/withdrawals/:id/disburse',
  validate({ body: disburseSchema }),
  financeController.disburse,
);

router.get(
  '/reconciliation',
  validate({ query: reconciliationQuerySchema }),
  financeController.getReconciliation,
);

export { router as financeRoutes };
