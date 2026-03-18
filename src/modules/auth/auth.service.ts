import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { AUTH, ROLE_PERMISSIONS, Role } from '../../config/constants';
import { AppError } from '../../common/errors';
import { authRepository } from './auth.repository';
import type { RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput } from './auth.schemas';
import type { TokenPair, AuthResponse, SessionInfo } from './auth.types';
import type { RoleType } from '@prisma/client';

function mapRoleToEnum(role: string): RoleType {
  const map: Record<string, RoleType> = {
    donor: 'DONOR',
    campaign_creator: 'CAMPAIGN_CREATOR',
  };
  return map[role] || 'DONOR';
}

function generateAccessToken(user: { id: string; email: string; roles: string[] }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number }
  );
}

function parseExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 60000);
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw AppError.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await argon2.hash(input.password);
    const roleEnum = mapRoleToEnum(input.role);

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: roleEnum,
    });

    const roles = user.userRoles.map((ur) => ur.role.toLowerCase());
    const accessToken = generateAccessToken({ id: user.id, email: user.email, roles });

    // Create email verification token
    const verificationToken = uuidv4();
    await authRepository.createEmailVerification({
      userId: user.id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + AUTH.EMAIL_VERIFICATION_EXPIRES_HOURS * 3600000),
    });

    // TODO: Enqueue email verification job

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        accountStatus: user.accountStatus,
      },
      accessToken,
    };
  },

  async login(
    input: LoginInput,
    meta: { userAgent?: string; ip?: string }
  ): Promise<AuthResponse & { refreshToken: string }> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw AppError.forbidden('Account is suspended', 'ACCOUNT_SUSPENDED');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const roles = user.userRoles.map((ur) => ur.role.toLowerCase());
    const accessToken = generateAccessToken({ id: user.id, email: user.email, roles });

    const family = uuidv4();
    const refreshTokenValue = uuidv4();
    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

    await authRepository.createRefreshToken({
      userId: user.id,
      token: refreshTokenValue,
      family,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        accountStatus: user.accountStatus,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    };
  },

  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ip?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existing = await authRepository.findRefreshToken(refreshToken);

    if (!existing) {
      throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // If token was already revoked, revoke the entire family (potential reuse attack)
    if (existing.revokedAt) {
      await authRepository.revokeTokenFamily(existing.family);
      throw AppError.unauthorized('Refresh token reuse detected', 'TOKEN_REUSE');
    }

    if (existing.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    // Revoke old token
    await authRepository.revokeRefreshToken(existing.id);

    // Issue new token pair
    const user = existing.user;
    const roles = user.userRoles.map((ur) => ur.role.toLowerCase());
    const accessToken = generateAccessToken({ id: user.id, email: user.email, roles });

    const newRefreshTokenValue = uuidv4();
    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

    await authRepository.createRefreshToken({
      userId: user.id,
      token: newRefreshTokenValue,
      family: existing.family,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    return { accessToken, refreshToken: newRefreshTokenValue };
  },

  async logout(refreshToken: string): Promise<void> {
    const existing = await authRepository.findRefreshToken(refreshToken);
    if (existing && !existing.revokedAt) {
      await authRepository.revokeRefreshToken(existing.id);
    }
  },

  async getSession(userId: string): Promise<SessionInfo> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.toLowerCase());
    const permissions = new Set<string>();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role as Role];
      if (rolePerms) rolePerms.forEach((p) => permissions.add(p));
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles,
      permissions: Array.from(permissions),
      accountStatus: user.accountStatus,
    };
  },

  async verifyEmail(token: string): Promise<void> {
    const verification = await authRepository.findEmailVerification(token);
    if (!verification) {
      throw AppError.badRequest('Invalid verification token', 'INVALID_TOKEN');
    }
    if (verification.usedAt) {
      throw AppError.badRequest('Token already used', 'TOKEN_USED');
    }
    if (verification.expiresAt < new Date()) {
      throw AppError.badRequest('Verification token expired', 'TOKEN_EXPIRED');
    }

    await authRepository.markEmailVerified(verification.userId, verification.id);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);
    // Always return success to avoid email enumeration
    if (!user) return;

    const token = uuidv4();
    await authRepository.createPasswordReset({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + AUTH.PASSWORD_RESET_EXPIRES_HOURS * 3600000),
    });

    // TODO: Enqueue password reset email job
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const reset = await authRepository.findPasswordReset(input.token);
    if (!reset) {
      throw AppError.badRequest('Invalid reset token', 'INVALID_TOKEN');
    }
    if (reset.usedAt) {
      throw AppError.badRequest('Token already used', 'TOKEN_USED');
    }
    if (reset.expiresAt < new Date()) {
      throw AppError.badRequest('Reset token expired', 'TOKEN_EXPIRED');
    }

    const passwordHash = await argon2.hash(input.password);
    await authRepository.resetPassword(reset.userId, reset.id, passwordHash);

    // Revoke all refresh tokens for security
    await authRepository.revokeAllUserTokens(reset.userId);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const valid = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw AppError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');
    }

    const passwordHash = await argon2.hash(input.newPassword);
    await authRepository.updatePassword(userId, passwordHash);

    // Revoke all refresh tokens so user must re-login
    await authRepository.revokeAllUserTokens(userId);
  },
};
