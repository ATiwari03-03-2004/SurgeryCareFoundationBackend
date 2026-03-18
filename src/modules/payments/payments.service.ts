import { AppError } from '../../common/errors';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { paymentsRepository } from './payments.repository';
import { donationsService } from '../donations/donations.service';
import { RazorpayGateway } from './payments.gateway.razorpay';
import type { PaymentGateway, VerifiedWebhookEvent } from './payments.types';
import type { DonationStatusEnum } from '@prisma/client';

function getGateway(provider?: string): PaymentGateway {
  const selectedProvider = provider ?? env.PAYMENT_PROVIDER;
  switch (selectedProvider) {
    case 'razorpay':
      return new RazorpayGateway();
    default:
      throw AppError.badRequest(`Unsupported payment provider: ${selectedProvider}`, 'UNSUPPORTED_PROVIDER');
  }
}

export const paymentsService = {
  async createPaymentIntent(donationId: string, amount: number, currency: string) {
    // Check if a payment intent already exists for this donation
    const existing = await paymentsRepository.findPaymentIntentByDonationId(donationId);
    if (existing) {
      return existing;
    }

    const gateway = getGateway();

    const result = await gateway.createIntent({
      donationId,
      amount,
      currency,
    });

    const paymentIntent = await paymentsRepository.createPaymentIntent({
      donationId,
      provider: env.PAYMENT_PROVIDER,
      providerIntentId: result.providerIntentId,
      providerOrderId: result.providerOrderId,
      amount,
      currency,
    });

    logger.info(
      { paymentIntentId: paymentIntent.id, donationId, provider: env.PAYMENT_PROVIDER },
      'Payment intent created',
    );

    return {
      ...paymentIntent,
      clientData: result.clientData,
    };
  },

  async processWebhook(
    provider: string,
    headers: Record<string, string>,
    rawBody: string | Buffer,
  ) {
    const gateway = getGateway(provider);

    // Verify signature and parse webhook
    let event: VerifiedWebhookEvent;
    try {
      event = await gateway.verifyWebhook({ headers, body: rawBody });
    } catch (err) {
      logger.error({ err, provider }, 'Webhook signature verification failed');
      throw err;
    }

    // Check for duplicate webhook event (idempotency)
    if (event.providerEventId) {
      const existingEvent = await paymentsRepository.findWebhookEventByProviderEventId(
        event.providerEventId,
      );
      if (existingEvent?.processed) {
        logger.info(
          { providerEventId: event.providerEventId },
          'Duplicate webhook event, skipping',
        );
        return { status: 'duplicate', eventId: existingEvent.id };
      }
    }

    // Store webhook event
    const webhookEvent = await paymentsRepository.createWebhookEvent({
      provider,
      eventType: event.eventType,
      providerEventId: event.providerEventId,
      payload: event.rawPayload,
    });

    try {
      // Find the payment intent by provider order ID
      let paymentIntent = event.providerOrderId
        ? await paymentsRepository.findPaymentIntentByProviderOrderId(event.providerOrderId)
        : null;

      if (!paymentIntent) {
        logger.warn(
          { providerOrderId: event.providerOrderId, providerEventId: event.providerEventId },
          'No payment intent found for webhook event',
        );
        await paymentsRepository.markWebhookProcessed(
          webhookEvent.id,
          'No matching payment intent found',
        );
        return { status: 'no_match', eventId: webhookEvent.id };
      }

      // Check for duplicate transaction (idempotency)
      const existingTxn = await paymentsRepository.findTransactionByProviderTxnId(
        event.providerTransactionId,
      );
      if (existingTxn) {
        logger.info(
          { providerTransactionId: event.providerTransactionId },
          'Duplicate transaction, skipping',
        );
        await paymentsRepository.markWebhookProcessed(webhookEvent.id);
        return { status: 'duplicate_transaction', eventId: webhookEvent.id };
      }

      // Process within a transaction for atomicity
      await prisma.$transaction(async (tx) => {
        // Create payment transaction record
        await paymentsRepository.createPaymentTransaction({
          paymentIntentId: paymentIntent!.id,
          providerTransactionId: event.providerTransactionId,
          provider,
          amount: event.amount,
          currency: event.currency,
          status: event.status,
          providerPayload: event.rawPayload,
        });

        // Update payment intent status
        const intentStatus = event.status === 'success' ? 'captured' : 'failed';
        await paymentsRepository.updatePaymentIntentStatus(
          paymentIntent!.id,
          intentStatus,
          event.rawPayload,
        );
      });

      // Update donation status (outside the DB transaction to use service-level logic)
      const donationStatus: DonationStatusEnum =
        event.status === 'success' ? 'SUCCEEDED' : 'FAILED';

      await donationsService.updateDonationStatus(
        paymentIntent.donationId,
        donationStatus,
      );

      await paymentsRepository.markWebhookProcessed(webhookEvent.id);

      logger.info(
        {
          webhookEventId: webhookEvent.id,
          donationId: paymentIntent.donationId,
          status: event.status,
        },
        'Webhook processed successfully',
      );

      return { status: 'processed', eventId: webhookEvent.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await paymentsRepository.markWebhookProcessed(webhookEvent.id, errorMessage);
      logger.error(
        { err, webhookEventId: webhookEvent.id },
        'Error processing webhook event',
      );
      throw err;
    }
  },

  async getPaymentStatus(paymentIntentId: string) {
    const intent = await prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: {
        donation: {
          select: { id: true, status: true, amount: true, currency: true },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!intent) {
      throw AppError.notFound('Payment intent not found', 'PAYMENT_INTENT_NOT_FOUND');
    }

    return intent;
  },
};
