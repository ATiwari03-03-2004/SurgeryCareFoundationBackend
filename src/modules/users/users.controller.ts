import type { Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/utils';
import { usersService } from './users.service';
import type { AuthenticatedRequest } from '../../common/types';

export const usersController = {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.getProfile(req.user!.id);
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  async updateDonorProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.updateDonorProfile(req.user!.id, req.body);
      sendSuccess(res, profile, 'Donor profile updated');
    } catch (err) {
      next(err);
    }
  },

  async updateCreatorProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.updateCreatorProfile(req.user!.id, req.body);
      sendSuccess(res, profile, 'Creator profile updated');
    } catch (err) {
      next(err);
    }
  },
};
