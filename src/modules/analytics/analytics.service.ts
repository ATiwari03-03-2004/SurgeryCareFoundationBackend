import { prisma } from '../../config/database';
import type { DashboardQuery, AnalyticsQuery } from './analytics.schemas';

function buildDateFilter(startDate?: string, endDate?: string) {
  const filter: { gte?: Date; lte?: Date } = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return Object.keys(filter).length > 0 ? filter : undefined;
}

function getDateTrunc(groupBy: 'day' | 'week' | 'month'): string {
  switch (groupBy) {
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
  }
}

export const analyticsService = {
  async getDashboard(query?: DashboardQuery) {
    const dateFilter = buildDateFilter(query?.startDate, query?.endDate);
    const donationWhere = dateFilter ? { createdAt: dateFilter } : {};

    const [
      totalFundsResult,
      totalPatientsResult,
      activeCampaigns,
      urgentCampaigns,
      totalDonors,
      pendingWithdrawals,
    ] = await Promise.all([
      // Total funds raised (succeeded donations)
      prisma.donation.aggregate({
        where: { status: 'SUCCEEDED', ...donationWhere },
        _sum: { amount: true },
      }),

      // Total patients = unique campaigns with at least one succeeded donation
      prisma.donation.groupBy({
        by: ['campaignId'],
        where: { status: 'SUCCEEDED', ...donationWhere },
      }),

      // Active campaigns
      prisma.campaign.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),

      // Urgent campaigns
      prisma.campaign.count({
        where: { status: 'ACTIVE', urgencyLevel: 'urgent', deletedAt: null },
      }),

      // Total unique donors (users who have succeeded donations)
      prisma.donation.groupBy({
        by: ['donorId'],
        where: {
          status: 'SUCCEEDED',
          donorId: { not: null },
          ...donationWhere,
        },
      }),

      // Pending withdrawals
      prisma.withdrawalRequest.count({
        where: { status: 'REQUESTED' },
      }),
    ]);

    return {
      totalFundsRaised: totalFundsResult._sum.amount ?? 0,
      totalPatients: totalPatientsResult.length,
      activeCampaigns,
      urgentCampaigns,
      totalDonors: totalDonors.length,
      pendingWithdrawals,
    };
  },

  async getDonationAnalytics(query: AnalyticsQuery) {
    const dateFilter = buildDateFilter(query.startDate, query.endDate);
    const whereClause = dateFilter ? `AND d.created_at >= $1 AND d.created_at <= $2` : '';
    const trunc = getDateTrunc(query.groupBy);

    // Use Prisma's raw query for date-based grouping
    const where: Record<string, unknown> = {
      status: 'SUCCEEDED' as const,
    };
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    // Get all succeeded donations in range, then group in JS for portability
    const donations = await prisma.donation.findMany({
      where: { status: 'SUCCEEDED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const groups = new Map<string, { total: number; count: number }>();

    for (const d of donations) {
      const date = new Date(d.createdAt);
      let key: string;

      if (trunc === 'day') {
        key = date.toISOString().slice(0, 10);
      } else if (trunc === 'week') {
        // Start of ISO week (Monday)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      } else {
        key = date.toISOString().slice(0, 7);
      }

      const existing = groups.get(key) ?? { total: 0, count: 0 };
      existing.total += Number(d.amount);
      existing.count += 1;
      groups.set(key, existing);
    }

    const data = Array.from(groups.entries()).map(([period, stats]) => ({
      period,
      total: stats.total,
      count: stats.count,
    }));

    return { groupBy: query.groupBy, data };
  },

  async getCampaignAnalytics(query: AnalyticsQuery) {
    const dateFilter = buildDateFilter(query.startDate, query.endDate);

    const campaigns = await prisma.campaign.findMany({
      where: {
        deletedAt: null,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,
        createdAt: true,
        _count: {
          select: { donations: true },
        },
      },
      orderBy: { raisedAmount: 'desc' },
    });

    const data = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      goalAmount: c.goalAmount,
      raisedAmount: c.raisedAmount,
      donationCount: c._count.donations,
      completionRate:
        Number(c.goalAmount) > 0
          ? Math.round((Number(c.raisedAmount) / Number(c.goalAmount)) * 10000) / 100
          : 0,
      createdAt: c.createdAt,
    }));

    return { data };
  },
};
