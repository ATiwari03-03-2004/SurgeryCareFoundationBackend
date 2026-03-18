import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { ROLE_PERMISSIONS, Role, Permission } from '../../config/constants';
import { AppError } from '../errors';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types';

interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    const permissions = new Set<string>();
    for (const role of payload.roles) {
      const rolePerms = ROLE_PERMISSIONS[role as Role];
      if (rolePerms) {
        rolePerms.forEach((p) => permissions.add(p));
      }
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: Array.from(permissions),
      accountStatus: 'active',
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid access token', 'TOKEN_INVALID');
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    authenticate(req, _res, next);
  } catch {
    next();
  }
}
