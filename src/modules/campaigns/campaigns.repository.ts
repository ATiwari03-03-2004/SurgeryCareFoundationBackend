import { prisma } from '../../config/database';
import type { Prisma, CampaignStatusEnum } from '@prisma/client';
import type { CreateCampaignInput, UpdateCampaignInput } from './campaigns.schemas';

export const campaignsRepository = {
  create(data: {
    creatorId: string;
    title: string;
    slug: string;
    summary?: string;
    description?: string;
    goalAmount: number;
    currency: string;
    category?: string;
    urgencyLevel?: string;
    coverImageUrl?: string;
    videoUrl?: string;
    startDate?: string;
    endDate?: string;
    medicalDetails?: CreateCampaignInput['medicalDetails'];
    hospitalDetails?: CreateCampaignInput['hospitalDetails'];
  }) {
    const { medicalDetails, hospitalDetails, startDate, endDate, ...campaignData } = data;

    return prisma.campaign.create({
      data: {
        ...campaignData,
        goalAmount: campaignData.goalAmount,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        medicalDetails: medicalDetails
          ? { create: medicalDetails }
          : undefined,
        hospitalDetails: hospitalDetails
          ? { create: hospitalDetails }
          : undefined,
        statusHistory: {
          create: {
            toStatus: 'DRAFT',
            changedBy: data.creatorId,
          },
        },
      },
      include: {
        medicalDetails: true,
        hospitalDetails: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        medicalDetails: true,
        hospitalDetails: true,
        documents: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        milestones: true,
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.campaign.findUnique({
      where: { slug },
      include: {
        medicalDetails: true,
        hospitalDetails: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
        milestones: true,
        updates: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  },

  findByCreator(creatorId: string, skip: number, take: number) {
    return Promise.all([
      prisma.campaign.findMany({
        where: { creatorId, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          medicalDetails: true,
          _count: { select: { donations: true } },
        },
      }),
      prisma.campaign.count({ where: { creatorId, deletedAt: null } }),
    ]);
  },

  findPublic(params: {
    skip: number;
    take: number;
    status?: CampaignStatusEnum;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.CampaignWhereInput = {
      status: params.status || 'ACTIVE',
      deletedAt: null,
    };

    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { summary: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CampaignOrderByWithRelationInput = {};
    const sortField = params.sortBy || 'created_at';
    const fieldMap: Record<string, string> = {
      created_at: 'createdAt',
      goal_amount: 'goalAmount',
      raised_amount: 'raisedAmount',
      title: 'title',
    };
    (orderBy as any)[fieldMap[sortField] || 'createdAt'] = params.sortOrder || 'desc';

    return Promise.all([
      prisma.campaign.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { donations: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);
  },

  update(id: string, data: Prisma.CampaignUpdateInput) {
    return prisma.campaign.update({
      where: { id },
      data,
      include: {
        medicalDetails: true,
        hospitalDetails: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },

  updateStatus(id: string, status: CampaignStatusEnum, changedBy: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({ where: { id } });
      if (!campaign) return null;

      const updated = await tx.campaign.update({
        where: { id },
        data: {
          status,
          publishedAt: status === 'ACTIVE' ? new Date() : undefined,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });

      await tx.campaignStatusHistory.create({
        data: {
          campaignId: id,
          fromStatus: campaign.status,
          toStatus: status,
          changedBy,
          reason,
        },
      });

      return updated;
    });
  },

  updateMedicalDetails(campaignId: string, data: any) {
    return prisma.campaignMedicalDetail.upsert({
      where: { campaignId },
      update: data,
      create: { campaignId, ...data },
    });
  },

  updateHospitalDetails(campaignId: string, data: any) {
    return prisma.campaignHospitalDetail.upsert({
      where: { campaignId },
      update: data,
      create: { campaignId, ...data },
    });
  },

  addUpdate(data: { campaignId: string; authorId: string; title: string; content: string; imageUrl?: string }) {
    return prisma.campaignUpdate.create({ data });
  },

  getUpdates(campaignId: string, skip: number, take: number) {
    return Promise.all([
      prisma.campaignUpdate.findMany({
        where: { campaignId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.campaignUpdate.count({ where: { campaignId } }),
    ]);
  },

  addMilestone(data: { campaignId: string; title: string; description?: string; targetAmount?: number }) {
    return prisma.campaignMilestone.create({
      data: {
        ...data,
        targetAmount: data.targetAmount,
      },
    });
  },

  getStatusHistory(campaignId: string) {
    return prisma.campaignStatusHistory.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
