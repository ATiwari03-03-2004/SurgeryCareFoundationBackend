import { prisma } from '../../config/database';
import { AppError } from '../../common/errors';
import { parsePagination, paginatedResult } from '../../common/utils';
import type { ModerationQuery } from './moderation.schemas';
import type { Prisma, CampaignStatusEnum } from '@prisma/client';

export const moderationService = {
  async listPendingCampaigns(query: ModerationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.CampaignWhereInput = {
      status: query.status
        ? (query.status as CampaignStatusEnum)
        : { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CampaignOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'created_at';
    const fieldMap: Record<string, string> = {
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      title: 'title',
    };
    (orderBy as any)[fieldMap[sortField] || 'createdAt'] = query.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          documents: { select: { id: true, fileName: true, fileType: true, verificationStatus: true } },
          _count: { select: { documents: true, reviewNotes: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  },

  async getCampaignForReview(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        medicalDetails: true,
        hospitalDetails: true,
        documents: {
          include: {
            reviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        milestones: true,
        reviewNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw AppError.notFound('Campaign not found');
    }

    return campaign;
  },

  async approveCampaign(id: string, reviewerId: string, note?: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw AppError.notFound('Campaign not found');

    // If SUBMITTED, first transition to UNDER_REVIEW
    if (campaign.status === 'SUBMITTED') {
      await prisma.$transaction(async (tx) => {
        await tx.campaign.update({
          where: { id },
          data: { status: 'UNDER_REVIEW' },
        });
        await tx.campaignStatusHistory.create({
          data: {
            campaignId: id,
            fromStatus: 'SUBMITTED',
            toStatus: 'UNDER_REVIEW',
            changedBy: reviewerId,
            reason: 'Auto-transitioned for review',
          },
        });
      });
    } else if (campaign.status !== 'UNDER_REVIEW') {
      throw AppError.badRequest(`Cannot approve campaign in '${campaign.status}' status`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          medicalDetails: true,
          hospitalDetails: true,
        },
      });

      await tx.campaignStatusHistory.create({
        data: {
          campaignId: id,
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'APPROVED',
          changedBy: reviewerId,
          reason: note || 'Campaign approved',
        },
      });

      if (note) {
        await tx.campaignReviewNote.create({
          data: {
            campaignId: id,
            reviewerId,
            note,
            action: 'APPROVED',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'CAMPAIGN_APPROVED',
          entityType: 'Campaign',
          entityId: id,
          oldValue: { status: 'UNDER_REVIEW' } as any,
          newValue: { status: 'APPROVED' } as any,
        },
      });

      return result;
    });

    return updated;
  },

  async rejectCampaign(id: string, reviewerId: string, reason: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw AppError.notFound('Campaign not found');

    if (campaign.status !== 'UNDER_REVIEW' && campaign.status !== 'SUBMITTED') {
      throw AppError.badRequest(`Cannot reject campaign in '${campaign.status}' status`);
    }

    const fromStatus = campaign.status;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          medicalDetails: true,
          hospitalDetails: true,
        },
      });

      await tx.campaignStatusHistory.create({
        data: {
          campaignId: id,
          fromStatus,
          toStatus: 'REJECTED',
          changedBy: reviewerId,
          reason,
        },
      });

      await tx.campaignReviewNote.create({
        data: {
          campaignId: id,
          reviewerId,
          note: reason,
          action: 'REJECTED',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'CAMPAIGN_REJECTED',
          entityType: 'Campaign',
          entityId: id,
          oldValue: { status: fromStatus } as any,
          newValue: { status: 'REJECTED' } as any,
        },
      });

      return result;
    });

    return updated;
  },

  async requestChanges(id: string, reviewerId: string, note: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw AppError.notFound('Campaign not found');

    if (campaign.status !== 'UNDER_REVIEW' && campaign.status !== 'SUBMITTED') {
      throw AppError.badRequest(`Cannot request changes for campaign in '${campaign.status}' status`);
    }

    const fromStatus = campaign.status;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: { status: 'DRAFT' },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          medicalDetails: true,
          hospitalDetails: true,
        },
      });

      await tx.campaignStatusHistory.create({
        data: {
          campaignId: id,
          fromStatus,
          toStatus: 'DRAFT',
          changedBy: reviewerId,
          reason: note,
        },
      });

      await tx.campaignReviewNote.create({
        data: {
          campaignId: id,
          reviewerId,
          note,
          action: 'CHANGES_REQUESTED',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'CAMPAIGN_CHANGES_REQUESTED',
          entityType: 'Campaign',
          entityId: id,
          oldValue: { status: fromStatus } as any,
          newValue: { status: 'DRAFT' } as any,
        },
      });

      return result;
    });

    return updated;
  },

  async verifyDocument(docId: string, reviewerId: string, notes?: string) {
    const document = await prisma.campaignDocument.findUnique({ where: { id: docId } });
    if (!document) throw AppError.notFound('Document not found');

    if (document.verificationStatus === 'VERIFIED') {
      throw AppError.badRequest('Document is already verified');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaignDocument.update({
        where: { id: docId },
        data: {
          verificationStatus: 'VERIFIED',
          reviewerId,
          reviewNotes: notes || null,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'DOCUMENT_VERIFIED',
          entityType: 'CampaignDocument',
          entityId: docId,
          oldValue: { verificationStatus: document.verificationStatus } as any,
          newValue: { verificationStatus: 'VERIFIED' } as any,
        },
      });

      return result;
    });

    return updated;
  },

  async rejectDocument(docId: string, reviewerId: string, reason: string) {
    const document = await prisma.campaignDocument.findUnique({ where: { id: docId } });
    if (!document) throw AppError.notFound('Document not found');

    if (document.verificationStatus === 'REJECTED') {
      throw AppError.badRequest('Document is already rejected');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaignDocument.update({
        where: { id: docId },
        data: {
          verificationStatus: 'REJECTED',
          reviewerId,
          reviewNotes: reason,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'DOCUMENT_REJECTED',
          entityType: 'CampaignDocument',
          entityId: docId,
          oldValue: { verificationStatus: document.verificationStatus } as any,
          newValue: { verificationStatus: 'REJECTED' } as any,
        },
      });

      return result;
    });

    return updated;
  },
};
