import { AppError } from '../../common/errors';
import { parsePagination, paginatedResult } from '../../common/utils';
import { prisma } from '../../config/database';
import { WithdrawalStatus } from '../../config/constants';
import { auditService } from '../audit/audit.service';
import { withdrawalsRepository } from './withdrawals.repository';
import type { CreateWithdrawalInput, WithdrawalQuery } from './withdrawals.schemas';

export const withdrawalsService = {
  async createWithdrawal(
    requesterId: string,
    input: CreateWithdrawalInput,
    meta?: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    // Verify campaign exists and belongs to the requester
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { id: true, creatorId: true, title: true, status: true },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found', 'CAMPAIGN_NOT_FOUND');
    }

    if (campaign.creatorId !== requesterId) {
      throw AppError.forbidden(
        'You can only request withdrawals for your own campaigns',
        'NOT_CAMPAIGN_OWNER',
      );
    }

    // Validate available balance
    const financials = await withdrawalsRepository.getCampaignFinancials(
      input.campaignId,
    );

    if (financials.availableBalance < input.amount) {
      throw AppError.badRequest(
        `Insufficient available balance. Available: ${financials.availableBalance.toFixed(2)}, Requested: ${input.amount.toFixed(2)}`,
        'INSUFFICIENT_BALANCE',
      );
    }

    // Create withdrawal in REQUESTED state
    const withdrawal = await withdrawalsRepository.create({
      campaignId: input.campaignId,
      requesterId,
      amount: input.amount,
      reason: input.reason,
    });

    // Audit log
    await auditService.log({
      actorId: requesterId,
      actorRole: 'campaign_creator',
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'WithdrawalRequest',
      entityId: withdrawal.id,
      newValue: {
        campaignId: input.campaignId,
        amount: input.amount,
        reason: input.reason,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return withdrawal;
  },

  async getWithdrawal(id: string, userId?: string, roles?: string[]) {
    const withdrawal = await withdrawalsRepository.findById(id);

    if (!withdrawal) {
      throw AppError.notFound('Withdrawal request not found', 'WITHDRAWAL_NOT_FOUND');
    }

    // Access control: requester, campaign creator, finance, or admin
    const isRequester = userId && withdrawal.requesterId === userId;
    const isCampaignCreator = userId && withdrawal.campaign.creatorId === userId;
    const hasFinanceAccess = roles?.some(
      (r) =>
        r === 'finance_manager' || r === 'moderator' || r === 'super_admin',
    );

    if (!isRequester && !isCampaignCreator && !hasFinanceAccess) {
      throw AppError.forbidden('You do not have access to this withdrawal request');
    }

    return withdrawal;
  },

  async getMyWithdrawals(requesterId: string, query: WithdrawalQuery) {
    const { page, limit, skip } = parsePagination(query);

    const { items, total } = await withdrawalsRepository.findByRequester(
      requesterId,
      skip,
      limit,
    );

    return paginatedResult(items, total, page, limit);
  },

  async getCampaignWithdrawals(
    campaignId: string,
    userId?: string,
    roles?: string[],
  ) {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorId: true },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found', 'CAMPAIGN_NOT_FOUND');
    }

    // Access control: campaign creator, finance, or admin
    const isCampaignCreator = userId && campaign.creatorId === userId;
    const hasFinanceAccess = roles?.some(
      (r) =>
        r === 'finance_manager' || r === 'moderator' || r === 'super_admin',
    );

    if (!isCampaignCreator && !hasFinanceAccess) {
      throw AppError.forbidden(
        'You do not have access to this campaign\'s withdrawals',
      );
    }

    const { items, total } = await withdrawalsRepository.findByCampaign(
      campaignId,
      0,
      100,
    );

    return { items, total };
  },

  async getCampaignBalance(campaignId: string) {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found', 'CAMPAIGN_NOT_FOUND');
    }

    return withdrawalsRepository.getCampaignFinancials(campaignId);
  },
};
