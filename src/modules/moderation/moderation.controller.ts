import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { moderationService } from './moderation.service';
import type { AuthenticatedRequest } from '../../common/types';

export const moderationController = {
  async listPendingCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await moderationService.listPendingCampaigns(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignForReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await moderationService.getCampaignForReview(req.params.id as string);
      sendSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  async approveCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await moderationService.approveCampaign(
        req.params.id as string,
        req.user!.id,
        req.body.note,
      );
      sendSuccess(res, campaign, 'Campaign approved');
    } catch (err) {
      next(err);
    }
  },

  async rejectCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await moderationService.rejectCampaign(
        req.params.id as string,
        req.user!.id,
        req.body.reason,
      );
      sendSuccess(res, campaign, 'Campaign rejected');
    } catch (err) {
      next(err);
    }
  },

  async requestChanges(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await moderationService.requestChanges(
        req.params.id as string,
        req.user!.id,
        req.body.note,
      );
      sendSuccess(res, campaign, 'Changes requested');
    } catch (err) {
      next(err);
    }
  },

  async verifyDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await moderationService.verifyDocument(
        req.params.id as string,
        req.user!.id,
        req.body.notes,
      );
      sendSuccess(res, document, 'Document verified');
    } catch (err) {
      next(err);
    }
  },

  async rejectDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await moderationService.rejectDocument(
        req.params.id as string,
        req.user!.id,
        req.body.reason,
      );
      sendSuccess(res, document, 'Document rejected');
    } catch (err) {
      next(err);
    }
  },
};
