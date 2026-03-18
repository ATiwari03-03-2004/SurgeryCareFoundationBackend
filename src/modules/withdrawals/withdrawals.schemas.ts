import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive('Amount must be a positive number'),
  reason: z.string().max(1000).optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;

export const withdrawalQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  campaignId: z.string().uuid().optional(),
  status: z
    .enum([
      'REQUESTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'PARTIALLY_DISBURSED',
      'FULLY_DISBURSED',
      'CANCELLED',
    ])
    .optional(),
});

export type WithdrawalQuery = z.infer<typeof withdrawalQuerySchema>;
