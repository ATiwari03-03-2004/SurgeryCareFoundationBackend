import { z } from 'zod';

export const createDonationSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().min(3).max(3).default('INR'),
  isAnonymous: z.boolean().default(false),
  message: z.string().max(500).optional(),
  donorName: z.string().max(100).optional(),
  donorEmail: z.string().email().optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

export const donationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  campaignId: z.string().uuid().optional(),
  status: z.enum(['INITIATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DonationQuery = z.infer<typeof donationQuerySchema>;
