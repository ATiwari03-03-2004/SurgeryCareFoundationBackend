import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { auditService } from './audit.service';
import type { AuthenticatedRequest } from '../../common/types';

export const auditController = {
  async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await auditService.getAuditLogs(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
