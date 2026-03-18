import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, requirePermission, validate } from '../../common/middleware';
import { Permission } from '../../config/constants';
import { auditLogQuerySchema } from './audit.schemas';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(Permission.AUDIT_VIEW),
  validate({ query: auditLogQuerySchema }),
  auditController.getLogs,
);

export { router as auditRoutes };
