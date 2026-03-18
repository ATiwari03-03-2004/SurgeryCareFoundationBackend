import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  actorId: z.string().uuid().optional(),
  entityType: z.string().max(100).optional(),
  action: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
