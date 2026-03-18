import { prisma } from '../../config/database';
import type { Prisma } from '@prisma/client';

export interface PaymentIntentCreateData {
  donationId: string;
  provider: string;
  providerIntentId: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
}

export interface PaymentTransactionCreateData {
  paymentIntentId: string;
  providerTransactionId: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  providerPayload?: unknown;
}

export interface WebhookEventCreateData {
  provider: string;
  eventType: string;
  providerEventId?: string;
  payload: unknown;
}

export const paymentsRepository = {
  createPaymentIntent(data: PaymentIntentCreateData) {
    return prisma.paymentIntent.create({
      data: {
        donationId: data.donationId,
        provider: data.provider,
        providerIntentId: data.providerIntentId,
        providerOrderId: data.providerOrderId,
        amount: data.amount,
        currency: data.currency,
        status: 'created',
      },
    });
  },

  findPaymentIntentByDonationId(donationId: string) {
    return prisma.paymentIntent.findUnique({
      where: { donationId },
      include: {
        donation: {
          select: { id: true, campaignId: true, status: true, amount: true },
        },
      },
    });
  },

  findPaymentIntentByProviderOrderId(orderId: string) {
    return prisma.paymentIntent.findUnique({
      where: { providerOrderId: orderId },
      include: {
        donation: {
          select: { id: true, campaignId: true, status: true, amount: true },
        },
      },
    });
  },

  updatePaymentIntentStatus(id: string, status: string, providerPayload?: unknown) {
    return prisma.paymentIntent.update({
      where: { id },
      data: {
        status,
        providerPayload: providerPayload as Prisma.InputJsonValue,
      },
    });
  },

  createPaymentTransaction(data: PaymentTransactionCreateData) {
    return prisma.paymentTransaction.create({
      data: {
        paymentIntentId: data.paymentIntentId,
        providerTransactionId: data.providerTransactionId,
        provider: data.provider,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        providerPayload: data.providerPayload as Prisma.InputJsonValue,
      },
    });
  },

  findTransactionByProviderTxnId(providerTransactionId: string) {
    return prisma.paymentTransaction.findUnique({
      where: { providerTransactionId },
    });
  },

  createWebhookEvent(data: WebhookEventCreateData) {
    return prisma.paymentWebhookEvent.create({
      data: {
        provider: data.provider,
        eventType: data.eventType,
        providerEventId: data.providerEventId,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
  },

  findWebhookEventByProviderEventId(providerEventId: string) {
    return prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId },
    });
  },

  markWebhookProcessed(id: string, error?: string) {
    return prisma.paymentWebhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        error: error ?? null,
      },
    });
  },
};
