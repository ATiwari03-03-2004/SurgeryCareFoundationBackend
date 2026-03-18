import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  accountStatus: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
