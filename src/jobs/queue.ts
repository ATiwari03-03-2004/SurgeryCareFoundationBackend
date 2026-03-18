import PgBoss from 'pg-boss';
import { env } from '../config/env';
import { logger } from '../config/logger';

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;

  boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: env.PG_BOSS_SCHEMA,
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInHours: 24,
    archiveCompletedAfterSeconds: 7 * 24 * 60 * 60,
    deleteAfterDays: 30,
  });

  boss.on('error', (err) => {
    logger.error({ err }, 'pg-boss error');
  });

  return boss;
}

export async function startQueue(): Promise<PgBoss> {
  const queue = await getQueue();
  await queue.start();
  logger.info('pg-boss queue started');
  return queue;
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 10000 });
    logger.info('pg-boss queue stopped');
  }
}

// Job type constants
export const JobType = {
  SEND_EMAIL: 'send-email',
  DONATION_CONFIRMATION: 'donation-confirmation',
  RECEIPT_EMAIL: 'receipt-email',
  CAMPAIGN_APPROVED: 'campaign-approved',
  CAMPAIGN_REJECTED: 'campaign-rejected',
  WITHDRAWAL_APPROVED: 'withdrawal-approved',
  WITHDRAWAL_REJECTED: 'withdrawal-rejected',
  RECURRING_DONATION_REMINDER: 'recurring-donation-reminder',
  INCOMPLETE_DONATION_FOLLOWUP: 'incomplete-donation-followup',
  EXPORT_GENERATION: 'export-generation',
  MILESTONE_NOTIFICATION: 'milestone-notification',
} as const;

export type JobTypeValue = typeof JobType[keyof typeof JobType];
