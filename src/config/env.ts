import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  APP_URL: z.string().url().default('http://localhost:8080'),
  WEB_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  EMAIL_PROVIDER: z.enum(['resend', 'sendgrid', 'ses']).default('resend'),
  RESEND_API_KEY: z.string().optional(),

  STORAGE_PROVIDER: z.enum(['r2', 'b2', 's3']).default('r2'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(['razorpay', 'stripe']).default('razorpay'),
  PAYMENT_KEY_ID: z.string().optional(),
  PAYMENT_KEY_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  CAPTCHA_PROVIDER: z.enum(['turnstile', 'recaptcha']).default('turnstile'),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  PG_BOSS_SCHEMA: z.string().default('pgboss'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
