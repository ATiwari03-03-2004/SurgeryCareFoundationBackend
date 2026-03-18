import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { Role } from '../../config/constants';
import { adminQuerySchema, exportSchema } from './admin.schemas';
import { auditLogQuerySchema } from '../audit/audit.schemas';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.SUPER_ADMIN));

router.get('/dashboard', adminController.getDashboard);

router.get(
  '/donors',
  validate({ query: adminQuerySchema }),
  adminController.getDonors,
);

router.get(
  '/campaigns',
  validate({ query: adminQuerySchema }),
  adminController.getCampaigns,
);

router.get(
  '/audit-logs',
  validate({ query: auditLogQuerySchema }),
  adminController.getAuditLogs,
);

router.post(
  '/exports/donors',
  validate({ body: exportSchema }),
  adminController.exportDonors,
);

router.post(
  '/exports/campaigns',
  validate({ body: exportSchema }),
  adminController.exportCampaigns,
);

export { router as adminRoutes };
