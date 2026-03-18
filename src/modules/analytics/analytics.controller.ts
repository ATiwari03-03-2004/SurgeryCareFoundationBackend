import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { analyticsService } from './analytics.service';
import type { AuthenticatedRequest } from '../../common/types';

export const analyticsController = {
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getDashboard(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getDonationAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getDonationAnalytics(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getCampaignAnalytics(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
