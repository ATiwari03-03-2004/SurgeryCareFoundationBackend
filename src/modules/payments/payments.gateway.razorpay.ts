import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';
import type {
  PaymentGateway,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  VerifyWebhookInput,
  VerifiedWebhookEvent,
} from './payments.types';

/**
 * Razorpay payment gateway implementation.
 *
 * In production, replace the placeholder createIntent logic with actual
 * Razorpay SDK calls (razorpay.orders.create). The webhook verification
 * uses the real HMAC SHA256 signature check that Razorpay documents.
 */
export class RazorpayGateway implements PaymentGateway {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.keyId = env.PAYMENT_KEY_ID ?? '';
    this.keySecret = env.PAYMENT_KEY_SECRET ?? '';
    this.webhookSecret = env.PAYMENT_WEBHOOK_SECRET ?? '';
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    // In production, this would call:
    //   const razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    //   const order = await razorpay.orders.create({
    //     amount: input.amount * 100, // Razorpay expects paise
    //     currency: input.currency,
    //     receipt: input.donationId,
    //     notes: input.metadata,
    //   });

    // Placeholder: generate a deterministic order ID for development
    const orderIdHash = crypto
      .createHmac('sha256', this.keySecret || 'dev-secret')
      .update(`${input.donationId}-${Date.now()}`)
      .digest('hex')
      .slice(0, 16);

    const providerOrderId = `order_${orderIdHash}`;
    const providerIntentId = providerOrderId;

    return {
      providerIntentId,
      providerOrderId,
      clientData: {
        key: this.keyId,
        order_id: providerOrderId,
        amount: input.amount * 100, // paise
        currency: input.currency,
        name: 'Surgery Care',
        description: `Donation ${input.donationId}`,
        prefill: input.metadata ?? {},
      },
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent> {
    const signature = input.headers['x-razorpay-signature'];

    if (!signature) {
      throw AppError.badRequest('Missing Razorpay signature header', 'MISSING_SIGNATURE');
    }

    // Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(typeof input.body === 'string' ? input.body : input.body.toString('utf-8'))
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );

    if (!isValid) {
      throw AppError.badRequest('Invalid webhook signature', 'INVALID_SIGNATURE');
    }

    const payload = JSON.parse(
      typeof input.body === 'string' ? input.body : input.body.toString('utf-8'),
    );

    const event = payload.event as string;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      throw AppError.badRequest('Invalid webhook payload structure', 'INVALID_PAYLOAD');
    }

    // Map Razorpay event types to our status
    let status: 'success' | 'failed';
    if (event === 'payment.captured' || event === 'payment.authorized') {
      status = 'success';
    } else if (event === 'payment.failed') {
      status = 'failed';
    } else {
      status = 'failed';
    }

    return {
      eventType: event,
      providerEventId: payload.event_id ?? `evt_${paymentEntity.id}`,
      providerTransactionId: paymentEntity.id,
      providerOrderId: paymentEntity.order_id,
      amount: paymentEntity.amount / 100, // Convert paise back to rupees
      currency: paymentEntity.currency,
      status,
      rawPayload: payload,
    };
  }
}
