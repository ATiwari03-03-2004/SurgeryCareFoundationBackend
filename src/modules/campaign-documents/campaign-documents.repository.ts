import { prisma } from '../../config/database';
import type { DocumentStatusEnum } from '@prisma/client';

export const campaignDocumentsRepository = {
  create(data: {
    campaignId: string;
    uploaderId: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    storageKey: string;
    checksum?: string;
  }) {
    return prisma.campaignDocument.create({ data });
  },

  findById(id: string) {
    return prisma.campaignDocument.findUnique({
      where: { id },
      include: { campaign: { select: { id: true, creatorId: true, status: true } } },
    });
  },

  findByCampaign(campaignId: string) {
    return prisma.campaignDocument.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  },

  updateVerification(id: string, data: {
    verificationStatus: DocumentStatusEnum;
    reviewerId: string;
    reviewNotes?: string;
  }) {
    return prisma.campaignDocument.update({
      where: { id },
      data: {
        ...data,
        reviewedAt: new Date(),
      },
    });
  },

  delete(id: string) {
    return prisma.campaignDocument.delete({ where: { id } });
  },
};
