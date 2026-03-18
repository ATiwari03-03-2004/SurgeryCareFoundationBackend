import { z } from 'zod';
import { UPLOAD } from '../../config/constants';

export const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.string().min(1).max(50),
  mimeType: z.enum([...UPLOAD.ALLOWED_DOC_TYPES] as [string, ...string[]]),
  fileSize: z.number().int().positive().max(UPLOAD.MAX_FILE_SIZE),
});

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  checksum: z.string().optional(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
