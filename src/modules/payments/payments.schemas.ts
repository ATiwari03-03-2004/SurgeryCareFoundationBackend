import { z } from 'zod';

export const createIntentSchema = z.object({
  donationId: z.string().uuid(),
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().min(3).max(3).default('INR'),
});

export type CreateIntentInput = z.infer<typeof createIntentSchema>;

export const webhookParamsSchema = z.object({
  provider: z.string().min(1).max(50),
});

export type WebhookParams = z.infer<typeof webhookParamsSchema>;
