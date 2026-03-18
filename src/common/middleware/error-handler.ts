import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { sendError } from '../utils/response';
import { logger } from '../../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, url: req.url, method: req.method }, 'Non-operational error');
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
