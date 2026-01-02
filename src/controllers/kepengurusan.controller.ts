import { Response } from 'express';
import { db } from '../config/database.js';
import { kepengurusan, users, departemen } from '../db/schema/index.js';
import { eq, and, isNull, like, sql, asc, desc } from 'drizzle-orm';
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
export const createKepengurusanSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    departemenId: z.string().uuid('Invalid departemen ID'),
    jabatan: z.string().min(1, 'Jabatan is required').max(100),
    periode: z.string().min(1, 'Periode is required').max(20),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateKepengurusanSchema = z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
    departemenId: z.string().uuid('Invalid departemen ID').optional(),
    jabatan: z.string().min(1).max(100).optional(),
    periode: z.string().min(1).max(20).optional(),
    startDate: z.string().optional(),
    endDate: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});

// Controllers
export async function getKepengurusan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & { periode?: string; departemenId?: string };
        const { page, limit, offset } = parsePagination(query);

        let whereClause = isNull(kepengurusan.deletedAt);

        if (query.periode) {
            whereClause = and(whereClause, eq(kepengurusan.periode, query.periode))!;
        }

        if (query.departemenId) {
            whereClause = and(whereClause, eq(kepengurusan.departemenId, query.departemenId))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(kepengurusan)
            .where(whereClause);

        const list = await db
            .select({
                id: kepengurusan.id,
                userId: kepengurusan.userId,
                departemenId: kepengurusan.departemenId,
                jabatan: kepengurusan.jabatan,
                periode: kepengurusan.periode,
                startDate: kepengurusan.startDate,
                endDate: kepengurusan.endDate,
                isActive: kepengurusan.isActive,
                createdAt: kepengurusan.createdAt,
                updatedAt: kepengurusan.updatedAt,
                userName: users.name,
                userEmail: users.email,
                departemenName: departemen.name,
            })
            .from(kepengurusan)
            .leftJoin(users, eq(kepengurusan.userId, users.id))
            .leftJoin(departemen, eq(kepengurusan.departemenId, departemen.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'desc' ? desc(kepengurusan.createdAt) : asc(kepengurusan.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Kepengurusan retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kepengurusan error:', error);
        errorResponse(res, 'Failed to get kepengurusan');
    }
}

export async function getKepengurusanById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: kepengurusan.id,
                userId: kepengurusan.userId,
                departemenId: kepengurusan.departemenId,
                jabatan: kepengurusan.jabatan,
                periode: kepengurusan.periode,
                startDate: kepengurusan.startDate,
                endDate: kepengurusan.endDate,
                isActive: kepengurusan.isActive,
                createdAt: kepengurusan.createdAt,
                updatedAt: kepengurusan.updatedAt,
                userName: users.name,
                userEmail: users.email,
                departemenName: departemen.name,
            })
            .from(kepengurusan)
            .leftJoin(users, eq(kepengurusan.userId, users.id))
            .leftJoin(departemen, eq(kepengurusan.departemenId, departemen.id))
            .where(
                and(
                    eq(kepengurusan.id, id),
                    isNull(kepengurusan.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Kepengurusan not found');
            return;
        }

        successResponse(res, item, 'Kepengurusan retrieved successfully');
    } catch (error) {
        console.error('Get kepengurusan error:', error);
        errorResponse(res, 'Failed to get kepengurusan');
    }
}

export async function createKepengurusan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        const [newItem] = await db
            .insert(kepengurusan)
            .values({
                userId: data.userId,
                departemenId: data.departemenId,
                jabatan: data.jabatan,
                periode: data.periode,
                startDate: data.startDate,
                endDate: data.endDate,
                isActive: data.isActive ?? true,
            })
            .returning();

        createdResponse(res, newItem, 'Kepengurusan created successfully');
    } catch (error) {
        console.error('Create kepengurusan error:', error);
        errorResponse(res, 'Failed to create kepengurusan');
    }
}

export async function updateKepengurusan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: kepengurusan.id })
            .from(kepengurusan)
            .where(
                and(
                    eq(kepengurusan.id, id),
                    isNull(kepengurusan.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kepengurusan not found');
            return;
        }

        const [updated] = await db
            .update(kepengurusan)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(kepengurusan.id, id))
            .returning();

        successResponse(res, updated, 'Kepengurusan updated successfully');
    } catch (error) {
        console.error('Update kepengurusan error:', error);
        errorResponse(res, 'Failed to update kepengurusan');
    }
}

export async function deleteKepengurusan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: kepengurusan.id })
            .from(kepengurusan)
            .where(
                and(
                    eq(kepengurusan.id, id),
                    isNull(kepengurusan.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kepengurusan not found');
            return;
        }

        // Hard delete
        await db
            .delete(kepengurusan)
            .where(eq(kepengurusan.id, id));

        successResponse(res, null, 'Kepengurusan deleted successfully');
    } catch (error) {
        console.error('Delete kepengurusan error:', error);
        errorResponse(res, 'Failed to delete kepengurusan');
    }
}
