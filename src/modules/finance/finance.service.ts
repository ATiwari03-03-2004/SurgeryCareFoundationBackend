import { AppError } from '../../common/errors';
import { parsePagination, paginatedResult } from '../../common/utils';
import { prisma } from '../../config/database';
import { WithdrawalStatus } from '../../config/constants';
import { auditService } from '../audit/audit.service';
import { withdrawalsRepository } from '../withdrawals/withdrawals.repository';
import { donationsRepository } from '../donations/donations.repository';
import type { FinanceQuery, ReconciliationQuery, DisburseInput } from './finance.schemas';
import type { WithdrawalStatusEnum } from '@prisma/client';

const APPROVAL_TRANSITIONS: WithdrawalStatusEnum[] = ['REQUESTED', 'UNDER_REVIEW'];
const REJECTION_TRANSITIONS: WithdrawalStatusEnum[] = ['REQUESTED', 'UNDER_REVIEW'];

export const financeService = {
  async getAllDonations(query: FinanceQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filters = {
      status: query.status as any,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const { items, total } = await donationsRepository.findAll(filters, skip, limit);

    return paginatedResult(items, total, page, limit);
  },

  async getWithdrawals(query: FinanceQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filters: { status?: WithdrawalStatusEnum } = {};
    if (query.status) {
      filters.status = query.status as WithdrawalStatusEnum;
    }

    const { items, total } = await withdrawalsRepository.findAll(
      filters,
      skip,
      limit,
    );

    return paginatedResult(items, total, page, limit);
  },

  async approveWithdrawal(
    id: string,
    reviewerId: string,
    note?: string,
    meta?: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const withdrawal = await withdrawalsRepository.findById(id);

    if (!withdrawal) {
      throw AppError.notFound('Withdrawal request not found', 'WITHDRAWAL_NOT_FOUND');
    }

    if (!APPROVAL_TRANSITIONS.includes(withdrawal.status)) {
      throw AppError.badRequest(
        `Cannot approve withdrawal in ${withdrawal.status} status. Must be REQUESTED or UNDER_REVIEW.`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updated = await withdrawalsRepository.updateStatus(
      id,
      'APPROVED',
      reviewerId,
      note,
    );

    await auditService.log({
      actorId: reviewerId,
      actorRole: 'finance_manager',
      action: 'WITHDRAWAL_APPROVED',
      entityType: 'WithdrawalRequest',
      entityId: id,
      newValue: {
        previousStatus: withdrawal.status,
        newStatus: 'APPROVED',
        note,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return updated;
  },

  async rejectWithdrawal(
    id: string,
    reviewerId: string,
    note: string,
    meta?: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    const withdrawal = await withdrawalsRepository.findById(id);

    if (!withdrawal) {
      throw AppError.notFound('Withdrawal request not found', 'WITHDRAWAL_NOT_FOUND');
    }

    if (!REJECTION_TRANSITIONS.includes(withdrawal.status)) {
      throw AppError.badRequest(
        `Cannot reject withdrawal in ${withdrawal.status} status. Must be REQUESTED or UNDER_REVIEW.`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updated = await withdrawalsRepository.updateStatus(
      id,
      'REJECTED',
      reviewerId,
      note,
    );

    await auditService.log({
      actorId: reviewerId,
      actorRole: 'finance_manager',
      action: 'WITHDRAWAL_REJECTED',
      entityType: 'WithdrawalRequest',
      entityId: id,
      newValue: {
        previousStatus: withdrawal.status,
        newStatus: 'REJECTED',
        note,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return updated;
  },

  async disburse(
    withdrawalId: string,
    disbursedBy: string,
    input: DisburseInput,
    meta?: { ip?: string; userAgent?: string; requestId?: string },
  ) {
    // Use a transaction for the entire disbursement operation
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        include: { disbursements: true },
      });

      if (!withdrawal) {
        throw AppError.notFound(
          'Withdrawal request not found',
          'WITHDRAWAL_NOT_FOUND',
        );
      }

      // Only APPROVED or PARTIALLY_DISBURSED can be disbursed
      if (
        withdrawal.status !== 'APPROVED' &&
        withdrawal.status !== 'PARTIALLY_DISBURSED'
      ) {
        throw AppError.badRequest(
          `Cannot disburse withdrawal in ${withdrawal.status} status. Must be APPROVED or PARTIALLY_DISBURSED.`,
          'INVALID_STATUS_TRANSITION',
        );
      }

      // Calculate already disbursed
      const alreadyDisbursed = withdrawal.disbursements.reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );
      const remaining = Number(withdrawal.amount) - alreadyDisbursed;

      if (input.amount > remaining) {
        throw AppError.badRequest(
          `Disbursement amount (${input.amount.toFixed(2)}) exceeds remaining amount (${remaining.toFixed(2)})`,
          'AMOUNT_EXCEEDS_REMAINING',
        );
      }

      // Create disbursement record
      const disbursement = await tx.withdrawalDisbursement.create({
        data: {
          withdrawalRequestId: withdrawalId,
          amount: input.amount,
          currency: withdrawal.currency,
          transactionRef: input.transactionRef,
          disbursedBy,
          notes: input.notes,
        },
      });

      // Determine new status
      const totalDisbursedAfter = alreadyDisbursed + input.amount;
      const newStatus: WithdrawalStatusEnum =
        totalDisbursedAfter >= Number(withdrawal.amount)
          ? 'FULLY_DISBURSED'
          : 'PARTIALLY_DISBURSED';

      // Update withdrawal status
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: newStatus },
        include: {
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
        },
      });

      // Audit log (outside transaction is fine; we call it after)
      // We'll queue it and execute after commit
      return { updated, disbursement, newStatus, totalDisbursedAfter };
    }).then(async (result) => {
      await auditService.log({
        actorId: disbursedBy,
        actorRole: 'finance_manager',
        action: 'WITHDRAWAL_DISBURSED',
        entityType: 'WithdrawalRequest',
        entityId: withdrawalId,
        newValue: {
          disbursementId: result.disbursement.id,
          amount: input.amount,
          transactionRef: input.transactionRef,
          newStatus: result.newStatus,
          totalDisbursed: result.totalDisbursedAfter,
        },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      return result.updated;
    });
  },

  async getReconciliation(query: ReconciliationQuery) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const [
      donationsTotal,
      donationsCount,
      withdrawalsTotal,
      withdrawalsCount,
      disbursementsTotal,
      disbursementsCount,
    ] = await Promise.all([
      // Total donations (succeeded) in period
      prisma.donation.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.donation.count({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total withdrawal requests in period
      prisma.withdrawalRequest.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total disbursements in period
      prisma.withdrawalDisbursement.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.withdrawalDisbursement.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      donations: {
        total: Number(donationsTotal._sum.amount ?? 0),
        count: donationsCount,
      },
      withdrawalRequests: {
        total: Number(withdrawalsTotal._sum.amount ?? 0),
        count: withdrawalsCount,
      },
      disbursements: {
        total: Number(disbursementsTotal._sum.amount ?? 0),
        count: disbursementsCount,
      },
      netBalance:
        Number(donationsTotal._sum.amount ?? 0) -
        Number(disbursementsTotal._sum.amount ?? 0),
    };
  },
};
