import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { adminService } from './admin.service';
import { auditService } from '../audit/audit.service';
import type { AuthenticatedRequest } from '../../common/types';

export const adminController = {
  async getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboard();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getDonors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDonors(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getCampaigns(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await auditService.getAuditLogs(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async exportDonors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { format, startDate, endDate } = req.body;
      const result = await adminService.exportDonors(format, { startDate, endDate });

      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="donors-export.${format}"`,
      );
      res.send(result.data);
    } catch (err) {
      next(err);
    }
  },

  async exportCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { format, startDate, endDate } = req.body;
      const result = await adminService.exportCampaigns(format, { startDate, endDate });

      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="campaigns-export.${format}"`,
      );
      res.send(result.data);
    } catch (err) {
      next(err);
    }
  },
};
