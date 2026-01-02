import { Response } from 'express';
import { db } from '../config/database.js';
import { arsip, departemen, users } from '../db/schema/index.js';
import { eq, and, isNull, like, sql, asc, desc, or } from 'drizzle-orm';
import {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
} from '../utils/response.js';
import { AuthRequest, PaginationQuery } from '../types/index.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { getFileUrl, deleteFile } from '../services/file-upload.service.js';
import { z } from 'zod';

// Validation schemas
export const createArsipSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    category: z.string().max(100).optional(),
    departemenId: z.string().uuid('Invalid departemen ID').optional(),
});

export const updateArsipSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    departemenId: z.string().uuid('Invalid departemen ID').nullable().optional(),
});

// Controllers
export async function getArsip(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & {
            departemenId?: string;
            category?: string;
            fileType?: string;
        };
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();

        let whereClause = isNull(arsip.deletedAt);

        if (search) {
            whereClause = and(
                whereClause,
                or(
                    like(sql`LOWER(${arsip.title})`, `%${search}%`),
                    like(sql`LOWER(${arsip.description})`, `%${search}%`)
                )
            )!;
        }

        if (query.departemenId) {
            whereClause = and(whereClause, eq(arsip.departemenId, query.departemenId))!;
        }

        if (query.category) {
            whereClause = and(whereClause, eq(arsip.category, query.category))!;
        }

        if (query.fileType) {
            whereClause = and(whereClause, eq(arsip.fileType, query.fileType))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(arsip)
            .where(whereClause);

        const list = await db
            .select({
                id: arsip.id,
                title: arsip.title,
                description: arsip.description,
                category: arsip.category,
                fileUrl: arsip.fileUrl,
                fileType: arsip.fileType,
                fileSize: arsip.fileSize,
                departemenId: arsip.departemenId,
                uploadedBy: arsip.uploadedBy,
                createdAt: arsip.createdAt,
                updatedAt: arsip.updatedAt,
                departemenName: departemen.name,
                uploaderName: users.name,
            })
            .from(arsip)
            .leftJoin(departemen, eq(arsip.departemenId, departemen.id))
            .leftJoin(users, eq(arsip.uploadedBy, users.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(arsip.createdAt) : desc(arsip.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Arsip retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get arsip error:', error);
        errorResponse(res, 'Failed to get arsip');
    }
}

export async function getArsipById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: arsip.id,
                title: arsip.title,
                description: arsip.description,
                category: arsip.category,
                fileUrl: arsip.fileUrl,
                fileType: arsip.fileType,
                fileSize: arsip.fileSize,
                departemenId: arsip.departemenId,
                uploadedBy: arsip.uploadedBy,
                createdAt: arsip.createdAt,
                updatedAt: arsip.updatedAt,
                departemenName: departemen.name,
                uploaderName: users.name,
            })
            .from(arsip)
            .leftJoin(departemen, eq(arsip.departemenId, departemen.id))
            .leftJoin(users, eq(arsip.uploadedBy, users.id))
            .where(
                and(
                    eq(arsip.id, id),
                    isNull(arsip.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Arsip not found');
            return;
        }

        successResponse(res, item, 'Arsip retrieved successfully');
    } catch (error) {
        console.error('Get arsip error:', error);
        errorResponse(res, 'Failed to get arsip');
    }
}

export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
        const categories = await db
            .selectDistinct({ category: arsip.category })
            .from(arsip)
            .where(
                and(
                    isNull(arsip.deletedAt),
                    sql`${arsip.category} IS NOT NULL`
                )
            )
            .orderBy(asc(arsip.category));

        successResponse(res, categories.map(c => c.category), 'Categories retrieved successfully');
    } catch (error) {
        console.error('Get categories error:', error);
        errorResponse(res, 'Failed to get categories');
    }
}

export async function createArsip(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;
        const uploadedById = req.user?.id;
        const file = req.file;

        if (!file) {
            errorResponse(res, 'File is required', 400);
            return;
        }

        const fileUrl = getFileUrl(file.path);

        const [newItem] = await db
            .insert(arsip)
            .values({
                title: data.title,
                description: data.description,
                category: data.category,
                fileUrl,
                fileType: file.mimetype,
                fileSize: file.size,
                departemenId: data.departemenId,
                uploadedBy: uploadedById,
            })
            .returning();

        createdResponse(res, newItem, 'Arsip uploaded successfully');
    } catch (error) {
        console.error('Create arsip error:', error);
        errorResponse(res, 'Failed to create arsip');
    }
}

export async function updateArsip(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;
        const file = req.file;

        const [existing] = await db
            .select({ id: arsip.id, fileUrl: arsip.fileUrl })
            .from(arsip)
            .where(
                and(
                    eq(arsip.id, id),
                    isNull(arsip.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Arsip not found');
            return;
        }

        const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

        // If new file uploaded, update file fields
        if (file) {
            updateData.fileUrl = getFileUrl(file.path);
            updateData.fileType = file.mimetype;
            updateData.fileSize = file.size;

            // Delete old file
            if (existing.fileUrl) {
                const oldPath = existing.fileUrl.replace('/uploads', './uploads');
                await deleteFile(oldPath);
            }
        }

        const [updated] = await db
            .update(arsip)
            .set(updateData)
            .where(eq(arsip.id, id))
            .returning();

        successResponse(res, updated, 'Arsip updated successfully');
    } catch (error) {
        console.error('Update arsip error:', error);
        errorResponse(res, 'Failed to update arsip');
    }
}

export async function deleteArsip(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: arsip.id })
            .from(arsip)
            .where(
                and(
                    eq(arsip.id, id),
                    isNull(arsip.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Arsip not found');
            return;
        }

        // Hard delete
        await db
            .delete(arsip)
            .where(eq(arsip.id, id));

        successResponse(res, null, 'Arsip deleted successfully');
    } catch (error) {
        console.error('Delete arsip error:', error);
        errorResponse(res, 'Failed to delete arsip');
    }
}
