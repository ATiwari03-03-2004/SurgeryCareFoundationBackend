import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils';
import { donationsService } from './donations.service';
import type { AuthenticatedRequest } from '../../common/types';

export const donationsController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await donationsService.createDonation(req.body, req.user?.id);
      sendCreated(res, result, 'Donation initiated successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const donation = await donationsService.getDonation(
        req.params.id as string,
        req.user?.id,
        req.user?.roles,
      );
      sendSuccess(res, donation);
    } catch (err) {
      next(err);
    }
  },

  async getMyDonations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await donationsService.getMyDonations(req.user!.id, req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await donationsService.getCampaignDonations(
        req.params.campaignId as string,
        req.query as any,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
