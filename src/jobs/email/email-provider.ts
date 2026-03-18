import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>;
}

class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    const { Resend } = await import('resend');
    const resend = new Resend(this.apiKey);

    const result = await resend.emails.send({
      from: 'Surgery Care <noreply@surgerycare.org>',
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { id: result.data?.id || 'unknown' };
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;

  switch (env.EMAIL_PROVIDER) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        logger.warn('RESEND_API_KEY not set, emails will be logged only');
        provider = new LogOnlyProvider();
      } else {
        provider = new ResendProvider(env.RESEND_API_KEY);
      }
      break;
    default:
      provider = new LogOnlyProvider();
  }

  return provider;
}

class LogOnlyProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ id: string }> {
    logger.info({ to: message.to, subject: message.subject }, 'Email (log-only mode)');
    return { id: `log-${Date.now()}` };
  }
}
