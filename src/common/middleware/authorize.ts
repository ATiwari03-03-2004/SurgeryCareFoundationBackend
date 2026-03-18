import type { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import type { AuthenticatedRequest } from '../types';
import type { Permission, Role } from '../../config/constants';

export function requirePermission(...permissions: Permission[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const hasPermission = permissions.some((p) => req.user!.permissions.includes(p));
    if (!hasPermission) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const hasRole = roles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      throw AppError.forbidden('Insufficient role');
    }

    next();
  };
}

export function requireActiveAccount(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw AppError.unauthorized();
  }

  if (req.user.accountStatus !== 'active') {
    throw AppError.forbidden('Account is not active', 'ACCOUNT_INACTIVE');
  }

  next();
}
