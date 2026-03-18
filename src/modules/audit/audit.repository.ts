import { prisma } from '../../config/database';
import type { Prisma } from '@prisma/client';

export interface AuditLogCreateData {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditLogFilters {
  actorId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

function buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.action) where.action = filters.action;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  return where;
}

export const auditRepository = {
  create(data: AuditLogCreateData) {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue as any,
        newValue: data.newValue as any,
        ip: data.ip,
        userAgent: data.userAgent,
        requestId: data.requestId,
      },
    });
  },

  findAll(filters: AuditLogFilters, skip: number, take: number) {
    const where = buildWhere(filters);

    return prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },

  countAll(filters: AuditLogFilters) {
    const where = buildWhere(filters);
    return prisma.auditLog.count({ where });
  },
};
