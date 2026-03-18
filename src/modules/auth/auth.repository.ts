import { prisma } from '../../config/database';
import type { RoleType } from '@prisma/client';

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
  },

  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: RoleType;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userRoles: {
          create: { role: data.role },
        },
      },
      include: { userRoles: true },
    });
  },

  createRefreshToken(data: {
    userId: string;
    token: string;
    family: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { userRoles: true } } },
    });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  revokeTokenFamily(family: string) {
    return prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  createEmailVerification(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return prisma.emailVerification.create({ data });
  },

  findEmailVerification(token: string) {
    return prisma.emailVerification.findUnique({
      where: { token },
    });
  },

  markEmailVerified(userId: string, verificationId: string) {
    return prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verificationId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { accountStatus: 'ACTIVE' },
      }),
    ]);
  },

  createPasswordReset(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return prisma.passwordReset.create({ data });
  },

  findPasswordReset(token: string) {
    return prisma.passwordReset.findUnique({
      where: { token },
    });
  },

  resetPassword(userId: string, resetId: string, passwordHash: string) {
    return prisma.$transaction([
      prisma.passwordReset.update({
        where: { id: resetId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
    ]);
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  cleanupExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
