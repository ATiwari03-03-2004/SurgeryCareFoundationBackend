import { AppError } from '../../common/errors';
import { usersRepository } from './users.repository';
import type { UpdateProfileInput, UpdateDonorProfileInput, UpdateCreatorProfileInput } from './users.schemas';

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      accountStatus: user.accountStatus,
      roles: user.userRoles.map((ur) => ur.role.toLowerCase()),
      donorProfile: user.donorProfile,
      creatorProfile: user.creatorProfile,
    };
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await usersRepository.updateProfile(userId, data);
    return user;
  },

  async updateDonorProfile(userId: string, data: UpdateDonorProfileInput) {
    return usersRepository.upsertDonorProfile(userId, data);
  },

  async updateCreatorProfile(userId: string, data: UpdateCreatorProfileInput) {
    return usersRepository.upsertCreatorProfile(userId, data);
  },
};
