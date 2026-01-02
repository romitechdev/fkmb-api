import { Response } from 'express';
import { db } from '../config/database.js';
import { kas } from '../db/schema/index.js';
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
export const createKasSchema = z.object({
    periode: z.string().min(1, 'Periode is required').max(20),
    saldoAwal: z.string().or(z.number()).transform(String).default('0'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateKasSchema = z.object({
    periode: z.string().min(1).max(20).optional(),
    saldoAwal: z.string().or(z.number()).transform(String).optional(),
    saldoAkhir: z.string().or(z.number()).transform(String).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});

// Controllers
export async function getKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & { isActive?: string };
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();

        let whereClause = isNull(kas.deletedAt);

        if (search) {
            whereClause = and(
                whereClause,
                like(sql`LOWER(${kas.periode})`, `%${search}%`)
            )!;
        }

        if (query.isActive !== undefined) {
            whereClause = and(whereClause, eq(kas.isActive, query.isActive === 'true'))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(kas)
            .where(whereClause);

        const list = await db
            .select()
            .from(kas)
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(kas.createdAt) : desc(kas.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Kas retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kas error:', error);
        errorResponse(res, 'Failed to get kas');
    }
}

export async function getKasById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select()
            .from(kas)
            .where(
                and(
                    eq(kas.id, id),
                    isNull(kas.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Kas not found');
            return;
        }

        successResponse(res, item, 'Kas retrieved successfully');
    } catch (error) {
        console.error('Get kas error:', error);
        errorResponse(res, 'Failed to get kas');
    }
}

export async function getActiveKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const [item] = await db
            .select()
            .from(kas)
            .where(
                and(
                    eq(kas.isActive, true),
                    isNull(kas.deletedAt)
                )
            )
            .orderBy(desc(kas.createdAt))
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'No active kas found');
            return;
        }

        successResponse(res, item, 'Active kas retrieved successfully');
    } catch (error) {
        console.error('Get active kas error:', error);
        errorResponse(res, 'Failed to get active kas');
    }
}

export async function createKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        // If creating as active, deactivate existing active kas
        if (data.isActive) {
            await db
                .update(kas)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(kas.isActive, true));
        }

        const [newItem] = await db
            .insert(kas)
            .values({
                periode: data.periode,
                saldoAwal: data.saldoAwal,
                saldoAkhir: data.saldoAwal, // Initially same as saldoAwal
                description: data.description,
                isActive: data.isActive ?? true,
            })
            .returning();

        createdResponse(res, newItem, 'Kas created successfully');
    } catch (error) {
        console.error('Create kas error:', error);
        errorResponse(res, 'Failed to create kas');
    }
}

export async function updateKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: kas.id })
            .from(kas)
            .where(
                and(
                    eq(kas.id, id),
                    isNull(kas.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kas not found');
            return;
        }

        // If setting as active, deactivate other kas
        if (data.isActive === true) {
            await db
                .update(kas)
                .set({ isActive: false, updatedAt: new Date() })
                .where(
                    and(
                        eq(kas.isActive, true),
                        sql`${kas.id} != ${id}`
                    )
                );
        }

        const [updated] = await db
            .update(kas)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(kas.id, id))
            .returning();

        successResponse(res, updated, 'Kas updated successfully');
    } catch (error) {
        console.error('Update kas error:', error);
        errorResponse(res, 'Failed to update kas');
    }
}

export async function deleteKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: kas.id })
            .from(kas)
            .where(
                and(
                    eq(kas.id, id),
                    isNull(kas.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kas not found');
            return;
        }

        // Hard delete
        await db
            .delete(kas)
            .where(eq(kas.id, id));

        successResponse(res, null, 'Kas deleted successfully');
    } catch (error) {
        console.error('Delete kas error:', error);
        errorResponse(res, 'Failed to delete kas');
    }
}
