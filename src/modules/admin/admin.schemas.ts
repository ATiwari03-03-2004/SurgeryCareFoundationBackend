import { z } from 'zod';

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
});

export type AdminQuery = z.infer<typeof adminQuerySchema>;

export const exportSchema = z.object({
  format: z.enum(['csv', 'json']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ExportQuery = z.infer<typeof exportSchema>;
