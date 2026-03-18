import { PAGINATION } from '../../config/constants';
import type { PaginationQuery, PaginatedResult } from '../types';

export function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, query.page ?? PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, query.limit ?? PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
