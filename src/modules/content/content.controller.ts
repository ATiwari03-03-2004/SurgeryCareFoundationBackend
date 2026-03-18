import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../../common/utils';
import { contentService } from './content.service';
import type { AuthenticatedRequest } from '../../common/types';

export const contentController = {
  // ─── Public ────────────────────────────────────────────────────

  async getPartnerHospitals(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contentService.getPartnerHospitals();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getBoardMembers(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contentService.getBoardMembers();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAnnualReports(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contentService.getAnnualReports();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const locale = (req.query.locale as string) ?? 'en';
      const result = await contentService.getContent(req.params.slug as string, locale);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────

  async createPartnerHospital(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.createPartnerHospital(req.body);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async updatePartnerHospital(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.updatePartnerHospital(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deletePartnerHospital(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await contentService.deletePartnerHospital(req.params.id as string);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  async createBoardMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.createBoardMember(req.body);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async updateBoardMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.updateBoardMember(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteBoardMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await contentService.deleteBoardMember(req.params.id as string);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  async createAnnualReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.createAnnualReport(req.body);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  },

  async upsertContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await contentService.upsertContent(req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
