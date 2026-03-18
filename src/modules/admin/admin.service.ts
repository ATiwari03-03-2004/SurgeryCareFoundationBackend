import { prisma } from '../../config/database';
import type { Prisma } from '@prisma/client';
import { parsePagination, paginatedResult } from '../../common/utils';
import { analyticsService } from '../analytics/analytics.service';
import type { AdminQuery, ExportQuery } from './admin.schemas';

function buildDonorWhere(query: AdminQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    userRoles: { some: { role: 'DONOR' } },
    deletedAt: null,
  };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.accountStatus = query.status as any;
  }

  return where;
}

function buildCampaignWhere(query: AdminQuery): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = {
    deletedAt: null,
  };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status as any;
  }

  return where;
}

function buildDateFilter(startDate?: string, endDate?: string) {
  const filter: { gte?: Date; lte?: Date } = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return Object.keys(filter).length > 0 ? filter : undefined;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

export const adminService = {
  async getDashboard() {
    return analyticsService.getDashboard();
  },

  async getDonors(query: AdminQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where = buildDonorWhere(query);

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          accountStatus: true,
          createdAt: true,
          donorProfile: true,
          _count: { select: { donations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  },

  async getCampaigns(query: AdminQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where = buildCampaignWhere(query);

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          urgencyLevel: true,
          createdAt: true,
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { donations: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  },

  async exportDonors(format: 'csv' | 'json', dateRange?: { startDate?: string; endDate?: string }) {
    const dateFilter = buildDateFilter(dateRange?.startDate, dateRange?.endDate);

    const donors = await prisma.user.findMany({
      where: {
        userRoles: { some: { role: 'DONOR' } },
        deletedAt: null,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        accountStatus: true,
        createdAt: true,
        donorProfile: {
          select: { displayName: true, isAnonymous: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = donors.map((d) => ({
      id: d.id,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone ?? '',
      accountStatus: d.accountStatus,
      displayName: d.donorProfile?.displayName ?? '',
      isAnonymous: d.donorProfile?.isAnonymous ?? false,
      createdAt: d.createdAt.toISOString(),
    }));

    if (format === 'csv') {
      return { contentType: 'text/csv', data: toCsv(rows as any) };
    }

    return { contentType: 'application/json', data: JSON.stringify(rows, null, 2) };
  },

  async exportCampaigns(format: 'csv' | 'json', dateRange?: { startDate?: string; endDate?: string }) {
    const dateFilter = buildDateFilter(dateRange?.startDate, dateRange?.endDate);

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
        category: true,
        urgencyLevel: true,
        createdAt: true,
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      goalAmount: Number(c.goalAmount),
      raisedAmount: Number(c.raisedAmount),
      category: c.category ?? '',
      urgencyLevel: c.urgencyLevel ?? '',
      creatorName: `${c.creator.firstName} ${c.creator.lastName}`,
      creatorEmail: c.creator.email,
      createdAt: c.createdAt.toISOString(),
    }));

    if (format === 'csv') {
      return { contentType: 'text/csv', data: toCsv(rows as any) };
    }

    return { contentType: 'application/json', data: JSON.stringify(rows, null, 2) };
  },
};
