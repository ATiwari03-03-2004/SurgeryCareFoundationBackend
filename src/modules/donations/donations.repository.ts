import { prisma } from '../../config/database';
import type { Prisma, DonationStatusEnum } from '@prisma/client';

export interface DonationCreateData {
  campaignId: string;
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  isAnonymous: boolean;
  message?: string;
}

export interface DonationFilters {
  campaignId?: string;
  status?: DonationStatusEnum;
  startDate?: string;
  endDate?: string;
}

function buildWhere(filters: DonationFilters): Prisma.DonationWhereInput {
  const where: Prisma.DonationWhereInput = {};

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.status) where.status = filters.status;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  return where;
}

export const donationsRepository = {
  create(data: DonationCreateData) {
    return prisma.donation.create({
      data: {
        campaignId: data.campaignId,
        donorId: data.donorId,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        amount: data.amount,
        currency: data.currency,
        isAnonymous: data.isAnonymous,
        message: data.message,
        status: 'INITIATED',
      },
    });
  },

  findById(id: string) {
    return prisma.donation.findUnique({
      where: { id },
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
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        paymentIntent: true,
        receipt: true,
      },
    });
  },

  async findByDonor(donorId: string, skip: number, take: number) {
    const where: Prisma.DonationWhereInput = { donorId };

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: { id: true, title: true, slug: true },
          },
          receipt: {
            select: { id: true, receiptNumber: true, issuedAt: true },
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  },

  async findByCampaign(campaignId: string, skip: number, take: number) {
    const where: Prisma.DonationWhereInput = { campaignId };

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  },

  async findAll(filters: DonationFilters, skip: number, take: number) {
    const where = buildWhere(filters);

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: { id: true, title: true, slug: true },
          },
          donor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          paymentIntent: {
            select: { id: true, provider: true, status: true },
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  },

  updateStatus(id: string, status: DonationStatusEnum) {
    return prisma.donation.update({
      where: { id },
      data: { status },
    });
  },

  async updateCampaignRaisedAmount(campaignId: string) {
    const result = await prisma.donation.aggregate({
      where: {
        campaignId,
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    });

    const raisedAmount = result._sum.amount ?? 0;

    return prisma.campaign.update({
      where: { id: campaignId },
      data: { raisedAmount },
    });
  },
};
