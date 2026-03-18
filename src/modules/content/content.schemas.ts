import { z } from 'zod';

export const partnerHospitalSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type PartnerHospitalInput = z.infer<typeof partnerHospitalSchema>;

export const boardMemberSchema = z.object({
  name: z.string().min(1).max(255),
  title: z.string().max(255).optional(),
  bio: z.string().max(5000).optional(),
  photoUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type BoardMemberInput = z.infer<typeof boardMemberSchema>;

export const annualReportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  title: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  storageKey: z.string().min(1),
});

export type AnnualReportInput = z.infer<typeof annualReportSchema>;

export const contentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ContentQuery = z.infer<typeof contentQuerySchema>;

export const localizedContentSchema = z.object({
  slug: z.string().min(1).max(255),
  locale: z.string().min(2).max(10).optional().default('en'),
  title: z.string().max(500).optional(),
  body: z.string().min(1),
});

export type LocalizedContentInput = z.infer<typeof localizedContentSchema>;
