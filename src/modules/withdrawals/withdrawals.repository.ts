import { prisma } from '../../config/database';
import type { Prisma, WithdrawalStatusEnum } from '@prisma/client';

export interface WithdrawalCreateData {
  campaignId: string;
  requesterId: string;
  amount: number;
  currency?: string;
  reason?: string;
}

export interface WithdrawalFilters {
  campaignId?: string;
  requesterId?: string;
  status?: WithdrawalStatusEnum;
}

export interface DisbursementCreateData {
  withdrawalRequestId: string;
  amount: number;
  currency?: string;
  transactionRef?: string;
  disbursedBy: string;
  notes?: string;
}

function buildWhere(filters: WithdrawalFilters): Prisma.WithdrawalRequestWhereInput {
  const where: Prisma.WithdrawalRequestWhereInput = {};

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.requesterId) where.requesterId = filters.requesterId;
  if (filters.status) where.status = filters.status;

  return where;
}

const withdrawalIncludes = {
  campaign: {
    select: {
      id: true,
      title: true,
      slug: true,
      creatorId: true,
      status: true,
    },
  },
  requester: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  disbursements: true,
} as const;

export const withdrawalsRepository = {
  create(data: WithdrawalCreateData) {
    return prisma.withdrawalRequest.create({
      data: {
        campaignId: data.campaignId,
        requesterId: data.requesterId,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        reason: data.reason,
        status: 'REQUESTED',
      },
      include: withdrawalIncludes,
    });
  },

  findById(id: string) {
    return prisma.withdrawalRequest.findUnique({
      where: { id },
      include: withdrawalIncludes,
    });
  },

  async findByCampaign(campaignId: string, skip: number, take: number) {
    const where: Prisma.WithdrawalRequestWhereInput = { campaignId };

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: withdrawalIncludes,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return { items, total };
  },

  async findByRequester(requesterId: string, skip: number, take: number) {
    const where: Prisma.WithdrawalRequestWhereInput = { requesterId };

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: withdrawalIncludes,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return { items, total };
  },

  async findAll(filters: WithdrawalFilters, skip: number, take: number) {
    const where = buildWhere(filters);

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: withdrawalIncludes,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return { items, total };
  },

  updateStatus(
    id: string,
    status: WithdrawalStatusEnum,
    reviewerId?: string,
    reviewNote?: string,
  ) {
    const data: Prisma.WithdrawalRequestUpdateInput = { status };

    if (reviewerId) {
      data.reviewer = { connect: { id: reviewerId } };
      data.reviewedAt = new Date();
    }
    if (reviewNote !== undefined) {
      data.reviewNote = reviewNote;
    }

    return prisma.withdrawalRequest.update({
      where: { id },
      data,
      include: withdrawalIncludes,
    });
  },

  async getCampaignFinancials(campaignId: string) {
    const [totalCollectedResult, totalWithdrawnResult, totalPendingResult] =
      await Promise.all([
        // Sum of succeeded donations
        prisma.donation.aggregate({
          where: { campaignId, status: 'SUCCEEDED' },
          _sum: { amount: true },
        }),
        // Sum of fully disbursed withdrawal requests
        prisma.withdrawalRequest.aggregate({
          where: { campaignId, status: 'FULLY_DISBURSED' },
          _sum: { amount: true },
        }),
        // Sum of pending withdrawal requests (requested + under_review + approved)
        prisma.withdrawalRequest.aggregate({
          where: {
            campaignId,
            status: { in: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'] },
          },
          _sum: { amount: true },
        }),
      ]);

    // Also account for partially disbursed amounts
    const partiallyDisbursedWithdrawals = await prisma.withdrawalRequest.findMany({
      where: { campaignId, status: 'PARTIALLY_DISBURSED' },
      include: { disbursements: { select: { amount: true } } },
    });

    let partiallyDisbursedTotal = 0;
    let partiallyDisbursedPending = 0;
    for (const wd of partiallyDisbursedWithdrawals) {
      const disbursed = wd.disbursements.reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );
      partiallyDisbursedTotal += disbursed;
      partiallyDisbursedPending += Number(wd.amount) - disbursed;
    }

    const totalCollected = Number(totalCollectedResult._sum.amount ?? 0);
    const totalWithdrawn =
      Number(totalWithdrawnResult._sum.amount ?? 0) + partiallyDisbursedTotal;
    const totalPendingWithdrawals =
      Number(totalPendingResult._sum.amount ?? 0) + partiallyDisbursedPending;
    const availableBalance = totalCollected - totalWithdrawn - totalPendingWithdrawals;

    return {
      totalCollected,
      totalWithdrawn,
      totalPendingWithdrawals,
      availableBalance,
    };
  },

  createDisbursement(data: DisbursementCreateData) {
    return prisma.withdrawalDisbursement.create({
      data: {
        withdrawalRequestId: data.withdrawalRequestId,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        transactionRef: data.transactionRef,
        disbursedBy: data.disbursedBy,
        notes: data.notes,
      },
    });
  },

  async getTotalDisbursedForWithdrawal(withdrawalRequestId: string) {
    const result = await prisma.withdrawalDisbursement.aggregate({
      where: { withdrawalRequestId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  },
};
