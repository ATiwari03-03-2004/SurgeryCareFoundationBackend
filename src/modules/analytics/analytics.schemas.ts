import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
