import { z } from 'zod';

export const approveWithdrawalSchema = z.object({
  note: z.string().max(1000).optional(),
});

export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalSchema>;

export const rejectWithdrawalSchema = z.object({
  note: z.string().min(1, 'Rejection reason is required').max(1000),
});

export type RejectWithdrawalInput = z.infer<typeof rejectWithdrawalSchema>;

export const disburseSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  transactionRef: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export type DisburseInput = z.infer<typeof disburseSchema>;

export const financeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type FinanceQuery = z.infer<typeof financeQuerySchema>;

export const reconciliationQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type ReconciliationQuery = z.infer<typeof reconciliationQuerySchema>;
