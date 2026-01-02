import { Response } from 'express';
import { db } from '../config/database.js';
import { kegiatan, users, departemen } from '../db/schema/index.js';
import { eq, and, isNull, like, sql, asc, desc, gte, lte } from 'drizzle-orm';
import {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
} from '../utils/response.js';
import { AuthRequest, PaginationQuery } from '../types/index.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { z } from 'zod';

// Validation schemas
export const createKegiatanSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
    location: z.string().max(255).optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    type: z.string().max(50).optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
    departemenId: z.string().uuid('Invalid departemen ID').optional(),
});

export const updateKegiatanSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    startDate: z.string().optional(),
    endDate: z.string().nullable().optional(),
    type: z.string().max(50).nullable().optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    departemenId: z.string().uuid('Invalid departemen ID').nullable().optional(),
});

// Controllers
export async function getKegiatan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & {
            status?: string;
            departemenId?: string;
            startFrom?: string;
            startTo?: string;
        };
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();

        let whereClause = isNull(kegiatan.deletedAt);

        if (search) {
            whereClause = and(
                whereClause,
                like(sql`LOWER(${kegiatan.name})`, `%${search}%`)
            )!;
        }

        if (query.status) {
            whereClause = and(whereClause, eq(kegiatan.status, query.status))!;
        }

        if (query.departemenId) {
            whereClause = and(whereClause, eq(kegiatan.departemenId, query.departemenId))!;
        }

        if (query.startFrom) {
            whereClause = and(whereClause, gte(kegiatan.startDate, new Date(query.startFrom)))!;
        }

        if (query.startTo) {
            whereClause = and(whereClause, lte(kegiatan.startDate, new Date(query.startTo)))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(kegiatan)
            .where(whereClause);

        const list = await db
            .select({
                id: kegiatan.id,
                name: kegiatan.name,
                description: kegiatan.description,
                location: kegiatan.location,
                startDate: kegiatan.startDate,
                endDate: kegiatan.endDate,
                type: kegiatan.type,
                status: kegiatan.status,
                departemenId: kegiatan.departemenId,
                createdBy: kegiatan.createdBy,
                createdAt: kegiatan.createdAt,
                updatedAt: kegiatan.updatedAt,
                departemenName: departemen.name,
                creatorName: users.name,
            })
            .from(kegiatan)
            .leftJoin(departemen, eq(kegiatan.departemenId, departemen.id))
            .leftJoin(users, eq(kegiatan.createdBy, users.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(kegiatan.startDate) : desc(kegiatan.startDate))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Kegiatan retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kegiatan error:', error);
        errorResponse(res, 'Failed to get kegiatan');
    }
}

export async function getKegiatanById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: kegiatan.id,
                name: kegiatan.name,
                description: kegiatan.description,
                location: kegiatan.location,
                startDate: kegiatan.startDate,
                endDate: kegiatan.endDate,
                type: kegiatan.type,
                status: kegiatan.status,
                departemenId: kegiatan.departemenId,
                createdBy: kegiatan.createdBy,
                createdAt: kegiatan.createdAt,
                updatedAt: kegiatan.updatedAt,
                departemenName: departemen.name,
                creatorName: users.name,
            })
            .from(kegiatan)
            .leftJoin(departemen, eq(kegiatan.departemenId, departemen.id))
            .leftJoin(users, eq(kegiatan.createdBy, users.id))
            .where(
                and(
                    eq(kegiatan.id, id),
                    isNull(kegiatan.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Kegiatan not found');
            return;
        }

        successResponse(res, item, 'Kegiatan retrieved successfully');
    } catch (error) {
        console.error('Get kegiatan error:', error);
        errorResponse(res, 'Failed to get kegiatan');
    }
}

export async function createKegiatan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;
        const createdById = req.user?.id;

        const [newItem] = await db
            .insert(kegiatan)
            .values({
                name: data.name,
                description: data.description,
                location: data.location,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                type: data.type,
                status: data.status,
                departemenId: data.departemenId,
                createdBy: createdById,
            })
            .returning();

        createdResponse(res, newItem, 'Kegiatan created successfully');
    } catch (error) {
        console.error('Create kegiatan error:', error);
        errorResponse(res, 'Failed to create kegiatan');
    }
}

export async function updateKegiatan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: kegiatan.id })
            .from(kegiatan)
            .where(
                and(
                    eq(kegiatan.id, id),
                    isNull(kegiatan.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kegiatan not found');
            return;
        }

        const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
        if (data.startDate) {
            updateData.startDate = new Date(data.startDate);
        }
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }

        const [updated] = await db
            .update(kegiatan)
            .set(updateData)
            .where(eq(kegiatan.id, id))
            .returning();

        successResponse(res, updated, 'Kegiatan updated successfully');
    } catch (error) {
        console.error('Update kegiatan error:', error);
        errorResponse(res, 'Failed to update kegiatan');
    }
}

export async function deleteKegiatan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: kegiatan.id })
            .from(kegiatan)
            .where(
                and(
                    eq(kegiatan.id, id),
                    isNull(kegiatan.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kegiatan not found');
            return;
        }

        // Hard delete
        await db
            .delete(kegiatan)
            .where(eq(kegiatan.id, id));

        successResponse(res, null, 'Kegiatan deleted successfully');
    } catch (error) {
        console.error('Delete kegiatan error:', error);
        errorResponse(res, 'Failed to delete kegiatan');
    }
}
