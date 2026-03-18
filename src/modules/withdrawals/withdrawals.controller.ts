import type { Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils';
import { withdrawalsService } from './withdrawals.service';
import type { AuthenticatedRequest } from '../../common/types';

export const withdrawalsController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await withdrawalsService.createWithdrawal(
        req.user!.id,
        req.body,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        },
      );
      sendCreated(res, result, 'Withdrawal request created successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const withdrawal = await withdrawalsService.getWithdrawal(
        req.params.id as string,
        req.user?.id,
        req.user?.roles,
      );
      sendSuccess(res, withdrawal);
    } catch (err) {
      next(err);
    }
  },

  async getMyWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await withdrawalsService.getMyWithdrawals(
        req.user!.id,
        req.query as any,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignWithdrawals(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await withdrawalsService.getCampaignWithdrawals(
        req.params.campaignId as string,
        req.user?.id,
        req.user?.roles,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignBalance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await withdrawalsService.getCampaignBalance(
        req.params.campaignId as string,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
