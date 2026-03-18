import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { financeService } from './finance.service';
import type { AuthenticatedRequest } from '../../common/types';

export const financeController = {
  async getAllDonations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.getAllDonations(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.getWithdrawals(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async approveWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.approveWithdrawal(
        req.params.id as string,
        req.user!.id,
        req.body.note,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, 'Withdrawal approved successfully');
    } catch (err) {
      next(err);
    }
  },

  async rejectWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.rejectWithdrawal(
        req.params.id as string,
        req.user!.id,
        req.body.note,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, 'Withdrawal rejected');
    } catch (err) {
      next(err);
    }
  },

  async disburse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.disburse(
        req.params.id as string,
        req.user!.id,
        req.body,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, 'Disbursement processed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.getReconciliation(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
