import { z } from 'zod';

export const approveCampaignSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const rejectCampaignSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(2000),
});

export const requestChangesSchema = z.object({
  note: z.string().min(1, 'Change request note is required').max(2000),
});

export const verifyDocumentSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const rejectDocumentSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(2000),
});

export const moderationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type ApproveCampaignInput = z.infer<typeof approveCampaignSchema>;
export type RejectCampaignInput = z.infer<typeof rejectCampaignSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;
export type ModerationQuery = z.infer<typeof moderationQuerySchema>;
