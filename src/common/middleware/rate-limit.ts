import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

export function rateLimit(options: { windowMs: number; max: number; keyPrefix?: string }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix || 'rl'}:${ip}`;
    const now = Date.now();

    const entry = store[key];
    if (!entry || now > entry.resetAt) {
      store[key] = { count: 1, resetAt: now + options.windowMs };
      next();
      return;
    }

    entry.count++;
    if (entry.count > options.max) {
      throw AppError.tooManyRequests();
    }

    next();
  };
}
