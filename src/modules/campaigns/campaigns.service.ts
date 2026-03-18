import { AppError } from '../../common/errors';
import { generateSlug, parsePagination, paginatedResult } from '../../common/utils';
import { CampaignStatus } from '../../config/constants';
import { campaignsRepository } from './campaigns.repository';
import type { CreateCampaignInput, UpdateCampaignInput, CampaignQuery, CampaignUpdateInput, CampaignMilestoneInput } from './campaigns.schemas';
import type { CampaignStatusEnum } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CLOSED'],
  PAUSED: ['ACTIVE', 'CLOSED'],
  REJECTED: ['DRAFT'],
  COMPLETED: ['CLOSED'],
};

export const campaignsService = {
  async create(creatorId: string, input: CreateCampaignInput) {
    const slug = generateSlug(input.title);

    return campaignsRepository.create({
      creatorId,
      title: input.title,
      slug,
      summary: input.summary,
      description: input.description,
      goalAmount: input.goalAmount,
      currency: input.currency || 'INR',
      category: input.category,
      urgencyLevel: input.urgencyLevel,
      coverImageUrl: input.coverImageUrl,
      videoUrl: input.videoUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      medicalDetails: input.medicalDetails,
      hospitalDetails: input.hospitalDetails,
    });
  },

  async getById(id: string, userId?: string) {
    const campaign = await campaignsRepository.findById(id);
    if (!campaign) throw AppError.notFound('Campaign not found');

    // Private campaigns only visible to creator/moderator/admin
    if (campaign.status === 'DRAFT' || campaign.status === 'SUBMITTED' || campaign.status === 'UNDER_REVIEW') {
      if (!userId || campaign.creatorId !== userId) {
        throw AppError.notFound('Campaign not found');
      }
    }

    return campaign;
  },

  async getBySlug(slug: string) {
    const campaign = await campaignsRepository.findBySlug(slug);
    if (!campaign) throw AppError.notFound('Campaign not found');

    // Only show public campaigns
    if (!['ACTIVE', 'COMPLETED', 'CLOSED'].includes(campaign.status)) {
      throw AppError.notFound('Campaign not found');
    }

    return campaign;
  },

  async listMyCampaigns(creatorId: string, query: CampaignQuery) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await campaignsRepository.findByCreator(creatorId, skip, limit);
    return paginatedResult(items, total, page, limit);
  },

  async listPublic(query: CampaignQuery) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await campaignsRepository.findPublic({
      skip,
      take: limit,
      status: query.status as CampaignStatusEnum | undefined,
      category: query.category,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return paginatedResult(items, total, page, limit);
  },

  async update(id: string, creatorId: string, input: UpdateCampaignInput) {
    const campaign = await campaignsRepository.findById(id);
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.creatorId !== creatorId) throw AppError.forbidden('Not your campaign');
    if (campaign.status !== 'DRAFT' && campaign.status !== 'REJECTED') {
      throw AppError.badRequest('Can only edit draft or rejected campaigns');
    }

    const { medicalDetails, hospitalDetails, ...campaignData } = input;
    const updateData: any = { ...campaignData };

    if (campaignData.startDate) updateData.startDate = new Date(campaignData.startDate);
    if (campaignData.endDate) updateData.endDate = new Date(campaignData.endDate);

    const updated = await campaignsRepository.update(id, updateData);

    if (medicalDetails) {
      await campaignsRepository.updateMedicalDetails(id, medicalDetails);
    }
    if (hospitalDetails) {
      await campaignsRepository.updateHospitalDetails(id, hospitalDetails);
    }

    return updated;
  },

  async submit(id: string, creatorId: string) {
    const campaign = await campaignsRepository.findById(id);
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.creatorId !== creatorId) throw AppError.forbidden('Not your campaign');

    if (!VALID_TRANSITIONS[campaign.status]?.includes('SUBMITTED')) {
      throw AppError.badRequest(`Cannot submit campaign in '${campaign.status}' status`);
    }

    // Validation: must have required fields
    if (!campaign.title || !campaign.goalAmount) {
      throw AppError.badRequest('Campaign must have a title and goal amount');
    }

    return campaignsRepository.updateStatus(id, 'SUBMITTED', creatorId);
  },

  async addUpdate(campaignId: string, authorId: string, input: CampaignUpdateInput) {
    const campaign = await campaignsRepository.findById(campaignId);
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.creatorId !== authorId) throw AppError.forbidden('Not your campaign');

    return campaignsRepository.addUpdate({
      campaignId,
      authorId,
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl,
    });
  },

  async getUpdates(campaignId: string, query: CampaignQuery) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await campaignsRepository.getUpdates(campaignId, skip, limit);
    return paginatedResult(items, total, page, limit);
  },

  async addMilestone(campaignId: string, creatorId: string, input: CampaignMilestoneInput) {
    const campaign = await campaignsRepository.findById(campaignId);
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.creatorId !== creatorId) throw AppError.forbidden('Not your campaign');

    return campaignsRepository.addMilestone({
      campaignId,
      title: input.title,
      description: input.description,
      targetAmount: input.targetAmount,
    });
  },
};
