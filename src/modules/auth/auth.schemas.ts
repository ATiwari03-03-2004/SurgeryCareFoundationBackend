import { z } from 'zod';
import { AUTH } from '../../config/constants';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`)
    .max(AUTH.PASSWORD_MAX_LENGTH),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  role: z.enum(['donor', 'campaign_creator']).optional().default('donor'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH)
    .max(AUTH.PASSWORD_MAX_LENGTH),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH)
    .max(AUTH.PASSWORD_MAX_LENGTH),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
