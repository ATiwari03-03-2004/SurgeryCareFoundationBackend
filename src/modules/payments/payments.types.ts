export interface CreatePaymentIntentInput {
  donationId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  providerIntentId: string;
  providerOrderId?: string;
  clientData: Record<string, unknown>; // Data needed by frontend to complete payment
}

export interface VerifyWebhookInput {
  headers: Record<string, string>;
  body: string | Buffer;
}

export interface VerifiedWebhookEvent {
  eventType: string;
  providerEventId: string;
  providerTransactionId: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  rawPayload: unknown;
}

export interface PaymentGateway {
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent>;
}
