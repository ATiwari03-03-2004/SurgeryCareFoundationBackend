import { AppError } from '../../common/errors';
import { parsePagination, paginatedResult } from '../../common/utils';
import { prisma } from '../../config/database';
import { DonationStatus, Permission } from '../../config/constants';
import { logger } from '../../config/logger';
import { donationsRepository } from './donations.repository';
import { paymentsService } from '../payments/payments.service';
import type { CreateDonationInput, DonationQuery } from './donations.schemas';
import type { DonationStatusEnum } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  [DonationStatus.INITIATED]: [DonationStatus.PENDING, DonationStatus.FAILED, DonationStatus.CANCELLED],
  [DonationStatus.PENDING]: [DonationStatus.SUCCEEDED, DonationStatus.FAILED, DonationStatus.CANCELLED],
  [DonationStatus.SUCCEEDED]: [DonationStatus.REFUNDED],
  [DonationStatus.FAILED]: [],
  [DonationStatus.CANCELLED]: [],
  [DonationStatus.REFUNDED]: [],
};

export const donationsService = {
  async createDonation(input: CreateDonationInput, donorId?: string) {
    // Verify campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { id: true, status: true, title: true },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found', 'CAMPAIGN_NOT_FOUND');
    }

    if (campaign.status !== 'ACTIVE') {
      throw AppError.badRequest('Campaign is not accepting donations', 'CAMPAIGN_NOT_ACTIVE');
    }

    // Create donation in INITIATED state
    const donation = await donationsRepository.create({
      campaignId: input.campaignId,
      donorId,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      amount: input.amount,
      currency: input.currency,
      isAnonymous: input.isAnonymous,
      message: input.message,
    });

    // Create payment intent via payment service
    const paymentIntent = await paymentsService.createPaymentIntent(
      donation.id,
      input.amount,
      input.currency,
    );

    logger.info(
      { donationId: donation.id, campaignId: input.campaignId, amount: input.amount },
      'Donation created',
    );

    return { donation, paymentIntent };
  },

  async getDonation(id: string, userId?: string, roles?: string[]) {
    const donation = await donationsRepository.findById(id);

    if (!donation) {
      throw AppError.notFound('Donation not found', 'DONATION_NOT_FOUND');
    }

    // Authorization: donor can see own, campaign creator can see theirs, admin/finance can see all
    const isOwner = userId && donation.donorId === userId;
    const isCampaignCreator = userId && donation.campaign.creatorId === userId;
    const hasViewAll = roles?.some(
      (r) => r === 'finance_manager' || r === 'moderator' || r === 'super_admin',
    );

    if (!isOwner && !isCampaignCreator && !hasViewAll) {
      throw AppError.forbidden('You do not have access to this donation');
    }

    return donation;
  },

  async getMyDonations(donorId: string, query: DonationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const { items, total } = await donationsRepository.findByDonor(donorId, skip, limit);

    return paginatedResult(items, total, page, limit);
  },

  async getCampaignDonations(campaignId: string, query: DonationQuery) {
    const { page, limit, skip } = parsePagination(query);

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found', 'CAMPAIGN_NOT_FOUND');
    }

    const { items, total } = await donationsRepository.findByCampaign(campaignId, skip, limit);

    // Strip donor info for anonymous donations
    const sanitizedItems = items.map((item) => {
      if (item.isAnonymous) {
        return {
          ...item,
          donorName: null,
          donorEmail: null,
          donor: null,
        };
      }
      return item;
    });

    return paginatedResult(sanitizedItems, total, page, limit);
  },

  async updateDonationStatus(id: string, status: DonationStatusEnum) {
    const donation = await donationsRepository.findById(id);

    if (!donation) {
      throw AppError.notFound('Donation not found', 'DONATION_NOT_FOUND');
    }

    const currentStatus = donation.status.toLowerCase();
    const targetStatus = status.toLowerCase();
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw AppError.badRequest(
        `Cannot transition donation from ${donation.status} to ${status}`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updatedDonation = await donationsRepository.updateStatus(id, status);

    // If succeeded, update campaign raised amount and create receipt
    if (status === 'SUCCEEDED') {
      await donationsRepository.updateCampaignRaisedAmount(donation.campaignId);

      // Create receipt record
      const receiptNumber = `RCP-${Date.now()}-${id.slice(0, 8).toUpperCase()}`;
      await prisma.donationReceipt.create({
        data: {
          donationId: id,
          receiptNumber,
        },
      });

      logger.info(
        { donationId: id, campaignId: donation.campaignId, receiptNumber },
        'Donation succeeded, receipt created',
      );
    }

    if (status === 'REFUNDED') {
      // Recalculate raised amount after refund
      await donationsRepository.updateCampaignRaisedAmount(donation.campaignId);

      logger.info(
        { donationId: id, campaignId: donation.campaignId },
        'Donation refunded, campaign amount recalculated',
      );
    }

    return updatedDonation;
  },
};
