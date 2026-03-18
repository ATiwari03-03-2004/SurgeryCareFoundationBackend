import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils';
import { paymentsService } from './payments.service';
import type { AuthenticatedRequest } from '../../common/types';

export const paymentsController = {
  async createIntent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { donationId, amount, currency } = req.body;
      const result = await paymentsService.createPaymentIntent(donationId, amount, currency);
      sendCreated(res, result, 'Payment intent created');
    } catch (err) {
      next(err);
    }
  },

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as string;

      // Raw body is expected to be available via express.raw() middleware
      const rawBody = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      }

      const result = await paymentsService.processWebhook(provider, headers, rawBody);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.getPaymentStatus(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
