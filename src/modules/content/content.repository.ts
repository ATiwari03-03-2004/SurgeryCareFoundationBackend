import { prisma } from '../../config/database';
import type {
  PartnerHospitalInput,
  BoardMemberInput,
  AnnualReportInput,
  LocalizedContentInput,
} from './content.schemas';

export const contentRepository = {
  // ─── Partner Hospitals ─────────────────────────────────────────

  createPartnerHospital(data: PartnerHospitalInput) {
    return prisma.partnerHospital.create({ data });
  },

  updatePartnerHospital(id: string, data: Partial<PartnerHospitalInput>) {
    return prisma.partnerHospital.update({ where: { id }, data });
  },

  deletePartnerHospital(id: string) {
    return prisma.partnerHospital.delete({ where: { id } });
  },

  findPartnerHospitalById(id: string) {
    return prisma.partnerHospital.findUnique({ where: { id } });
  },

  findActivePartnerHospitals() {
    return prisma.partnerHospital.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findAllPartnerHospitals(skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.partnerHospital.findMany({
        skip,
        take,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.partnerHospital.count(),
    ]);
    return { items, total };
  },

  // ─── Board Members ────────────────────────────────────────────

  createBoardMember(data: BoardMemberInput) {
    return prisma.boardMember.create({ data });
  },

  updateBoardMember(id: string, data: Partial<BoardMemberInput>) {
    return prisma.boardMember.update({ where: { id }, data });
  },

  deleteBoardMember(id: string) {
    return prisma.boardMember.delete({ where: { id } });
  },

  findBoardMemberById(id: string) {
    return prisma.boardMember.findUnique({ where: { id } });
  },

  findActiveBoardMembers() {
    return prisma.boardMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findAllBoardMembers(skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.boardMember.findMany({
        skip,
        take,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.boardMember.count(),
    ]);
    return { items, total };
  },

  // ─── Annual Reports ───────────────────────────────────────────

  createAnnualReport(data: AnnualReportInput) {
    return prisma.annualReport.create({
      data: {
        year: data.year,
        title: data.title,
        fileUrl: data.fileUrl,
        storageKey: data.storageKey,
        publishedAt: new Date(),
      },
    });
  },

  findPublishedAnnualReports() {
    return prisma.annualReport.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { year: 'desc' },
    });
  },

  async findAllAnnualReports(skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.annualReport.findMany({
        skip,
        take,
        orderBy: { year: 'desc' },
      }),
      prisma.annualReport.count(),
    ]);
    return { items, total };
  },

  // ─── Localized Content ────────────────────────────────────────

  upsertLocalizedContent(data: LocalizedContentInput) {
    const locale = data.locale ?? 'en';

    return prisma.localizedContent.upsert({
      where: {
        slug_locale: { slug: data.slug, locale },
      },
      create: {
        slug: data.slug,
        locale,
        title: data.title,
        body: data.body,
      },
      update: {
        title: data.title,
        body: data.body,
      },
    });
  },

  findContentBySlug(slug: string, locale: string = 'en') {
    return prisma.localizedContent.findUnique({
      where: {
        slug_locale: { slug, locale },
      },
    });
  },

  async findAllContent(skip: number, take: number) {
    const [items, total] = await Promise.all([
      prisma.localizedContent.findMany({
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.localizedContent.count(),
    ]);
    return { items, total };
  },
};
