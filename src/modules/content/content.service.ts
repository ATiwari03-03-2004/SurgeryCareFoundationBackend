import { AppError } from '../../common/errors';
import { parsePagination, paginatedResult } from '../../common/utils';
import { contentRepository } from './content.repository';
import type {
  PartnerHospitalInput,
  BoardMemberInput,
  AnnualReportInput,
  LocalizedContentInput,
  ContentQuery,
} from './content.schemas';

export const contentService = {
  // ─── Partner Hospitals ─────────────────────────────────────────

  async getPartnerHospitals() {
    return contentRepository.findActivePartnerHospitals();
  },

  async createPartnerHospital(data: PartnerHospitalInput) {
    return contentRepository.createPartnerHospital(data);
  },

  async updatePartnerHospital(id: string, data: Partial<PartnerHospitalInput>) {
    const existing = await contentRepository.findPartnerHospitalById(id);
    if (!existing) {
      throw AppError.notFound('Partner hospital not found');
    }
    return contentRepository.updatePartnerHospital(id, data);
  },

  async deletePartnerHospital(id: string) {
    const existing = await contentRepository.findPartnerHospitalById(id);
    if (!existing) {
      throw AppError.notFound('Partner hospital not found');
    }
    await contentRepository.deletePartnerHospital(id);
  },

  // ─── Board Members ────────────────────────────────────────────

  async getBoardMembers() {
    return contentRepository.findActiveBoardMembers();
  },

  async createBoardMember(data: BoardMemberInput) {
    return contentRepository.createBoardMember(data);
  },

  async updateBoardMember(id: string, data: Partial<BoardMemberInput>) {
    const existing = await contentRepository.findBoardMemberById(id);
    if (!existing) {
      throw AppError.notFound('Board member not found');
    }
    return contentRepository.updateBoardMember(id, data);
  },

  async deleteBoardMember(id: string) {
    const existing = await contentRepository.findBoardMemberById(id);
    if (!existing) {
      throw AppError.notFound('Board member not found');
    }
    await contentRepository.deleteBoardMember(id);
  },

  // ─── Annual Reports ───────────────────────────────────────────

  async getAnnualReports() {
    return contentRepository.findPublishedAnnualReports();
  },

  async createAnnualReport(data: AnnualReportInput) {
    return contentRepository.createAnnualReport(data);
  },

  // ─── Localized Content ────────────────────────────────────────

  async getContent(slug: string, locale: string = 'en') {
    const content = await contentRepository.findContentBySlug(slug, locale);
    if (!content) {
      throw AppError.notFound('Content not found');
    }
    return content;
  },

  async upsertContent(data: LocalizedContentInput) {
    return contentRepository.upsertLocalizedContent(data);
  },
};
