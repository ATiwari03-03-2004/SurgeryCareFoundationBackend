import type { Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils';
import { campaignsService } from './campaigns.service';
import type { AuthenticatedRequest } from '../../common/types';

export const campaignsController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.create(req.user!.id, req.body);
      sendCreated(res, campaign, 'Campaign created');
    } catch (err) {
      next(err);
    }
  },

  async getMy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignsService.listMyCampaigns(req.user!.id, req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.getById(req.params.id as string, req.user?.id);
      sendSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.update(req.params.id as string, req.user!.id, req.body);
      sendSuccess(res, campaign, 'Campaign updated');
    } catch (err) {
      next(err);
    }
  },

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.submit(req.params.id as string, req.user!.id);
      sendSuccess(res, campaign, 'Campaign submitted for review');
    } catch (err) {
      next(err);
    }
  },

  async addUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const update = await campaignsService.addUpdate(req.params.id as string, req.user!.id, req.body);
      sendCreated(res, update, 'Update posted');
    } catch (err) {
      next(err);
    }
  },

  async getUpdates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignsService.getUpdates(req.params.id as string, req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async addMilestone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const milestone = await campaignsService.addMilestone(req.params.id as string, req.user!.id, req.body);
      sendCreated(res, milestone, 'Milestone created');
    } catch (err) {
      next(err);
    }
  },

  // Public endpoints
  async listPublic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignsService.listPublic(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPublicBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignsService.getBySlug(req.params.slug as string);
      sendSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  async getPublicUpdates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignsService.getUpdates(req.params.slug as string, req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
