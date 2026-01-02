import { Response } from 'express';
import { db } from '../config/database.js';
import { roles } from '../db/schema/index.js';
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
export const createRoleSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().nullable().optional(),
    permissions: z.array(z.string()).optional(),
});

// Controllers
export async function getRoles(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery;
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();

        const whereClause = search
            ? and(
                isNull(roles.deletedAt),
                like(sql`LOWER(${roles.name})`, `%${search}%`)
            )
            : isNull(roles.deletedAt);

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(roles)
            .where(whereClause);

        const roleList = await db
            .select()
            .from(roles)
            .where(whereClause)
            .orderBy(query.sortOrder === 'desc' ? desc(roles.name) : asc(roles.name))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, roleList, 'Roles retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get roles error:', error);
        errorResponse(res, 'Failed to get roles');
    }
}

export async function getRoleById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [role] = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.id, id),
                    isNull(roles.deletedAt)
                )
            )
            .limit(1);

        if (!role) {
            notFoundResponse(res, 'Role not found');
            return;
        }

        successResponse(res, role, 'Role retrieved successfully');
    } catch (error) {
        console.error('Get role error:', error);
        errorResponse(res, 'Failed to get role');
    }
}

export async function createRole(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        // Check if role name exists
        const [existing] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(eq(roles.name, data.name.toLowerCase()))
            .limit(1);

        if (existing) {
            errorResponse(res, 'Role name already exists', 409);
            return;
        }

        const [newRole] = await db
            .insert(roles)
            .values({
                name: data.name.toLowerCase(),
                description: data.description,
                permissions: data.permissions,
            })
            .returning();

        createdResponse(res, newRole, 'Role created successfully');
    } catch (error) {
        console.error('Create role error:', error);
        errorResponse(res, 'Failed to create role');
    }
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(
                and(
                    eq(roles.id, id),
                    isNull(roles.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Role not found');
            return;
        }

        if (data.name) {
            const [nameExists] = await db
                .select({ id: roles.id })
                .from(roles)
                .where(
                    and(
                        eq(roles.name, data.name.toLowerCase()),
                        sql`${roles.id} != ${id}`
                    )
                )
                .limit(1);

            if (nameExists) {
                errorResponse(res, 'Role name already exists', 409);
                return;
            }
        }

        const [updatedRole] = await db
            .update(roles)
            .set({
                ...data,
                name: data.name?.toLowerCase(),
                updatedAt: new Date(),
            })
            .where(eq(roles.id, id))
            .returning();

        successResponse(res, updatedRole, 'Role updated successfully');
    } catch (error) {
        console.error('Update role error:', error);
        errorResponse(res, 'Failed to update role');
    }
}

export async function deleteRole(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(
                and(
                    eq(roles.id, id),
                    isNull(roles.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Role not found');
            return;
        }

        // Hard delete
        await db
            .delete(roles)
            .where(eq(roles.id, id));

        successResponse(res, null, 'Role deleted successfully');
    } catch (error) {
        console.error('Delete role error:', error);
        errorResponse(res, 'Failed to delete role');
    }
}
