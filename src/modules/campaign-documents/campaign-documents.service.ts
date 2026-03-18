import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../common/errors';
import { campaignDocumentsRepository } from './campaign-documents.repository';
import { campaignsRepository } from '../campaigns/campaigns.repository';
import type { RequestUploadInput } from './campaign-documents.schemas';

export const campaignDocumentsService = {
  async requestUpload(campaignId: string, userId: string, input: RequestUploadInput) {
    const campaign = await campaignsRepository.findById(campaignId);
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.creatorId !== userId) throw AppError.forbidden('Not your campaign');

    const storageKey = `campaigns/${campaignId}/docs/${uuidv4()}-${input.fileName}`;

    // In production, generate a signed upload URL from the storage provider
    // For now, return the storage key for the client to use
    const uploadUrl = `https://storage.example.com/upload?key=${encodeURIComponent(storageKey)}`;

    const doc = await campaignDocumentsRepository.create({
      campaignId,
      uploaderId: userId,
      fileName: input.fileName,
      fileType: input.fileType,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKey,
    });

    return { document: doc, uploadUrl };
  },

  async getDocuments(campaignId: string, userId: string, userRoles: string[]) {
    const campaign = await campaignsRepository.findById(campaignId);
    if (!campaign) throw AppError.notFound('Campaign not found');

    // Access control
    const isCreator = campaign.creatorId === userId;
    const isStaff = userRoles.some((r) =>
      ['moderator', 'finance_manager', 'super_admin'].includes(r)
    );

    if (!isCreator && !isStaff) {
      throw AppError.forbidden('Cannot access campaign documents');
    }

    return campaignDocumentsRepository.findByCampaign(campaignId);
  },

  async getSecureUrl(docId: string, userId: string, userRoles: string[]) {
    const doc = await campaignDocumentsRepository.findById(docId);
    if (!doc) throw AppError.notFound('Document not found');

    const isCreator = doc.campaign.creatorId === userId;
    const isStaff = userRoles.some((r) =>
      ['moderator', 'finance_manager', 'super_admin'].includes(r)
    );

    if (!isCreator && !isStaff) {
      throw AppError.forbidden('Cannot access this document');
    }

    // In production, generate a signed download URL
    const downloadUrl = `https://storage.example.com/download?key=${encodeURIComponent(doc.storageKey)}`;

    return { downloadUrl, document: doc };
  },
};
