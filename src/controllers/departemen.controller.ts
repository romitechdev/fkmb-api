import { Response } from 'express';
import { db } from '../config/database.js';
import { departemen, users, roles } from '../db/schema/index.js';
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
export const createDepartemenSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    logo: z.string().optional(),
});

export const updateDepartemenSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
});

// Controllers
export async function getDepartemen(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery;
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();

        const whereClause = search
            ? and(
                isNull(departemen.deletedAt),
                like(sql`LOWER(${departemen.name})`, `%${search}%`)
            )
            : isNull(departemen.deletedAt);

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(departemen)
            .where(whereClause);

        const list = await db
            .select()
            .from(departemen)
            .where(whereClause)
            .orderBy(query.sortOrder === 'desc' ? desc(departemen.name) : asc(departemen.name))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Departemen retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get departemen error:', error);
        errorResponse(res, 'Failed to get departemen');
    }
}

export async function getDepartemenById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select()
            .from(departemen)
            .where(
                and(
                    eq(departemen.id, id),
                    isNull(departemen.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Departemen not found');
            return;
        }

        successResponse(res, item, 'Departemen retrieved successfully');
    } catch (error) {
        console.error('Get departemen error:', error);
        errorResponse(res, 'Failed to get departemen');
    }
}

export async function createDepartemen(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        const [newItem] = await db
            .insert(departemen)
            .values({
                name: data.name,
                description: data.description,
                logo: data.logo,
            })
            .returning();

        createdResponse(res, newItem, 'Departemen created successfully');
    } catch (error) {
        console.error('Create departemen error:', error);
        errorResponse(res, 'Failed to create departemen');
    }
}

export async function updateDepartemen(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: departemen.id })
            .from(departemen)
            .where(
                and(
                    eq(departemen.id, id),
                    isNull(departemen.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Departemen not found');
            return;
        }

        const [updated] = await db
            .update(departemen)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(departemen.id, id))
            .returning();

        successResponse(res, updated, 'Departemen updated successfully');
    } catch (error) {
        console.error('Update departemen error:', error);
        errorResponse(res, 'Failed to update departemen');
    }
}

export async function deleteDepartemen(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: departemen.id })
            .from(departemen)
            .where(
                and(
                    eq(departemen.id, id),
                    isNull(departemen.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Departemen not found');
            return;
        }

        // Hard delete
        await db
            .delete(departemen)
            .where(eq(departemen.id, id));

        successResponse(res, null, 'Departemen deleted successfully');
    } catch (error) {
        console.error('Delete departemen error:', error);
        errorResponse(res, 'Failed to delete departemen');
    }
}

// Get members of a departemen
export async function getDepartemenMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Check if departemen exists
        const [dept] = await db
            .select({ id: departemen.id, name: departemen.name })
            .from(departemen)
            .where(
                and(
                    eq(departemen.id, id),
                    isNull(departemen.deletedAt)
                )
            )
            .limit(1);

        if (!dept) {
            notFoundResponse(res, 'Departemen not found');
            return;
        }

        // Get all users in this departemen
        const members = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                isActive: users.isActive,
                roleName: roles.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(
                and(
                    eq(users.departemenId, id),
                    isNull(users.deletedAt)
                )
            )
            .orderBy(asc(users.name));

        successResponse(res, {
            departemen: dept,
            members,
            totalMembers: members.length,
        }, 'Departemen members retrieved successfully');
    } catch (error) {
        console.error('Get departemen members error:', error);
        errorResponse(res, 'Failed to get departemen members');
    }
}
