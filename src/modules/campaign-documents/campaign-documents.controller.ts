import type { Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils';
import { campaignDocumentsService } from './campaign-documents.service';
import type { AuthenticatedRequest } from '../../common/types';

export const campaignDocumentsController = {
  async requestUpload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignDocumentsService.requestUpload(
        req.params.id as string,
        req.user!.id,
        req.body
      );
      sendCreated(res, result, 'Upload URL generated');
    } catch (err) {
      next(err);
    }
  },

  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const docs = await campaignDocumentsService.getDocuments(
        req.params.id as string,
        req.user!.id,
        req.user!.roles
      );
      sendSuccess(res, docs);
    } catch (err) {
      next(err);
    }
  },

  async getSecureUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await campaignDocumentsService.getSecureUrl(
        req.params.docId as string,
        req.user!.id,
        req.user!.roles
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
