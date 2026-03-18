import { parsePagination, paginatedResult } from '../../common/utils';
import { auditRepository } from './audit.repository';
import type { AuditLogCreateData } from './audit.repository';
import type { AuditLogQuery } from './audit.schemas';

export const auditService = {
  async log(data: AuditLogCreateData) {
    return auditRepository.create(data);
  },

  async getAuditLogs(query: AuditLogQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filters = {
      actorId: query.actorId,
      entityType: query.entityType,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const [items, total] = await Promise.all([
      auditRepository.findAll(filters, skip, limit),
      auditRepository.countAll(filters),
    ]);

    return paginatedResult(items, total, page, limit);
  },
};
