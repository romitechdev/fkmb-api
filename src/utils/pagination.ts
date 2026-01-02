import { PaginationQuery, PaginationMeta } from '../types/index.js';

export function parsePagination(query: PaginationQuery): {
    page: number;
    limit: number;
    offset: number;
} {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

export function createPaginationMeta(
    total: number,
    page: number,
    limit: number
): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
