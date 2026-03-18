import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
