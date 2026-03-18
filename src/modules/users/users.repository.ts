import { prisma } from '../../config/database';
import type { UpdateProfileInput, UpdateDonorProfileInput, UpdateCreatorProfileInput } from './users.schemas';

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
        donorProfile: true,
        creatorProfile: true,
      },
    });
  },

  updateProfile(id: string, data: UpdateProfileInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  upsertDonorProfile(userId: string, data: UpdateDonorProfileInput) {
    return prisma.donorProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  upsertCreatorProfile(userId: string, data: UpdateCreatorProfileInput) {
    return prisma.campaignCreatorProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  getDonorProfile(userId: string) {
    return prisma.donorProfile.findUnique({ where: { userId } });
  },

  getCreatorProfile(userId: string) {
    return prisma.campaignCreatorProfile.findUnique({ where: { userId } });
  },
};
