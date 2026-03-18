import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateDonorProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  isAnonymous: z.boolean().optional(),
  languagePreference: z.string().max(10).optional(),
  contactPreference: z.enum(['email', 'phone', 'none']).optional(),
});

export const updateCreatorProfileSchema = z.object({
  organizationName: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  panNumber: z.string().max(20).optional(),
  bankAccountName: z.string().max(200).optional(),
  bankAccountNumber: z.string().max(30).optional(),
  bankIfsc: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
});

export const preferencesSchema = z.object({
  languagePreference: z.string().max(10).optional(),
  contactPreference: z.enum(['email', 'phone', 'none']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateDonorProfileInput = z.infer<typeof updateDonorProfileSchema>;
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
