import type PgBoss from 'pg-boss';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { getEmailProvider } from './email-provider';
import { JobType } from '../queue';
import { renderTemplate } from '../../templates/emails/renderer';

interface SendEmailJob {
  to: string;
  template: string;
  subject: string;
  data: Record<string, unknown>;
}

export function registerEmailHandlers(boss: PgBoss): void {
  boss.work(JobType.SEND_EMAIL, async (jobs: PgBoss.Job<SendEmailJob>[]) => {
    for (const job of jobs) {
      const { to, template, subject, data } = job.data;
      const provider = getEmailProvider();

      try {
        const html = renderTemplate(template, data);
        const result = await provider.send({ to, subject, html });

        await prisma.emailLog.create({
          data: {
            toEmail: to,
            template,
            subject,
            status: 'sent',
            providerId: result.id,
            sentAt: new Date(),
          },
        });

        logger.info({ to, template, providerId: result.id }, 'Email sent');
      } catch (err) {
        await prisma.emailLog.create({
          data: {
            toEmail: to,
            template,
            subject,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          },
        });

        logger.error({ err, to, template }, 'Email send failed');
        throw err;
      }
    }
  });

  boss.work(JobType.DONATION_CONFIRMATION, async (jobs: PgBoss.Job[]) => {
    for (const job of jobs) {
      const { donorEmail, donorName, amount, campaignTitle } = job.data as any;
      const provider = getEmailProvider();
      const html = renderTemplate('donation-success', { donorName, amount, campaignTitle });
      await provider.send({ to: donorEmail, subject: 'Thank you for your donation!', html });
    }
  });

  boss.work(JobType.CAMPAIGN_APPROVED, async (jobs: PgBoss.Job[]) => {
    for (const job of jobs) {
      const { creatorEmail, creatorName, campaignTitle } = job.data as any;
      const provider = getEmailProvider();
      const html = renderTemplate('campaign-approved', { creatorName, campaignTitle });
      await provider.send({ to: creatorEmail, subject: 'Your campaign has been approved!', html });
    }
  });

  boss.work(JobType.CAMPAIGN_REJECTED, async (jobs: PgBoss.Job[]) => {
    for (const job of jobs) {
      const { creatorEmail, creatorName, campaignTitle, reason } = job.data as any;
      const provider = getEmailProvider();
      const html = renderTemplate('campaign-rejected', { creatorName, campaignTitle, reason });
      await provider.send({ to: creatorEmail, subject: 'Campaign review update', html });
    }
  });

  logger.info('Email job handlers registered');
}
