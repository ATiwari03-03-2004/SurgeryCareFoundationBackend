import type { Response } from 'express';
import type { ApiSuccess, ApiError } from '../types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: unknown): void {
  const body: ApiError = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  res.status(statusCode).json(body);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
