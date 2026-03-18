import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  goalAmount: z.number().positive().max(100000000),
  currency: z.string().default('INR'),
  category: z.string().max(50).optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  coverImageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  medicalDetails: z.object({
    patientName: z.string().min(1).max(200),
    patientAge: z.number().int().positive().optional(),
    patientGender: z.enum(['male', 'female', 'other']).optional(),
    diagnosis: z.string().max(2000).optional(),
    treatmentType: z.string().max(200).optional(),
    treatmentCost: z.number().positive().optional(),
    doctorName: z.string().max(200).optional(),
  }).optional(),
  hospitalDetails: z.object({
    hospitalName: z.string().min(1).max(200),
    hospitalCity: z.string().max(100).optional(),
    hospitalState: z.string().max(100).optional(),
    hospitalPhone: z.string().max(20).optional(),
    hospitalEmail: z.string().email().optional(),
  }).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'goal_amount', 'raised_amount', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const campaignUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  imageUrl: z.string().url().optional(),
});

export const campaignMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetAmount: z.number().positive().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignQuery = z.infer<typeof campaignQuerySchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
export type CampaignMilestoneInput = z.infer<typeof campaignMilestoneSchema>;
