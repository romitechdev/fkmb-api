import { Response } from 'express';
import { db } from '../config/database.js';
import { absensiToken, kegiatan } from '../db/schema/index.js';
import { eq, and, isNull, asc, desc, sql } from 'drizzle-orm';
import {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
} from '../utils/response.js';
import { AuthRequest, PaginationQuery } from '../types/index.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { generateShortToken } from '../utils/password.js';
import { generateQRCode } from '../utils/qr-generator.js';
import { z } from 'zod';

// Validation schemas
export const createAbsensiTokenSchema = z.object({
    kegiatanId: z.string().uuid('Invalid kegiatan ID'),
    label: z.string().max(255).optional(), // Keterangan pertemuan: "Rapat 1", "Day 1"    
    expiresAt: z.string().min(1, 'Expiry date is required'),
    isActive: z.boolean().default(true),
});

export const updateAbsensiTokenSchema = z.object({
    label: z.string().max(255).optional().nullable(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
});

// Controllers
export async function getAbsensiTokens(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & { kegiatanId?: string; isActive?: string };
        const { page, limit, offset } = parsePagination(query);

        let whereClause = isNull(absensiToken.deletedAt);

        if (query.kegiatanId) {
            whereClause = and(whereClause, eq(absensiToken.kegiatanId, query.kegiatanId))!;
        }

        if (query.isActive !== undefined) {
            whereClause = and(whereClause, eq(absensiToken.isActive, query.isActive === 'true'))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(absensiToken)
            .where(whereClause);

        const list = await db
            .select({
                id: absensiToken.id,
                kegiatanId: absensiToken.kegiatanId,
                token: absensiToken.token,
                label: absensiToken.label,
                qrCode: absensiToken.qrCode,
                expiresAt: absensiToken.expiresAt,
                isActive: absensiToken.isActive,
                createdAt: absensiToken.createdAt,
                updatedAt: absensiToken.updatedAt,
                kegiatanName: kegiatan.name,
            })
            .from(absensiToken)
            .leftJoin(kegiatan, eq(absensiToken.kegiatanId, kegiatan.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(absensiToken.createdAt) : desc(absensiToken.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Absensi tokens retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get absensi tokens error:', error);
        errorResponse(res, 'Failed to get absensi tokens');
    }
}

export async function getAbsensiTokenById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: absensiToken.id,
                kegiatanId: absensiToken.kegiatanId,
                token: absensiToken.token,
                qrCode: absensiToken.qrCode,
                expiresAt: absensiToken.expiresAt,
                isActive: absensiToken.isActive,
                createdAt: absensiToken.createdAt,
                updatedAt: absensiToken.updatedAt,
                kegiatanName: kegiatan.name,
            })
            .from(absensiToken)
            .leftJoin(kegiatan, eq(absensiToken.kegiatanId, kegiatan.id))
            .where(
                and(
                    eq(absensiToken.id, id),
                    isNull(absensiToken.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Absensi token not found');
            return;
        }

        successResponse(res, item, 'Absensi token retrieved successfully');
    } catch (error) {
        console.error('Get absensi token error:', error);
        errorResponse(res, 'Failed to get absensi token');
    }
}

export async function createAbsensiToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        // Verify kegiatan exists
        const [kegiatanExists] = await db
            .select({ id: kegiatan.id })
            .from(kegiatan)
            .where(
                and(
                    eq(kegiatan.id, data.kegiatanId),
                    isNull(kegiatan.deletedAt)
                )
            )
            .limit(1);

        if (!kegiatanExists) {
            notFoundResponse(res, 'Kegiatan not found');
            return;
        }

        // Generate unique 8-character uppercase token for easy manual input
        const token = generateShortToken(8);

        // Generate QR code with token data
        const qrData = JSON.stringify({
            token,
            kegiatanId: data.kegiatanId,
        });
        const qrCode = await generateQRCode(qrData);

        const [newItem] = await db
            .insert(absensiToken)
            .values({
                kegiatanId: data.kegiatanId,
                token,
                label: data.label || null,
                qrCode,
                expiresAt: new Date(data.expiresAt),
                isActive: data.isActive ?? true,
            })
            .returning();

        createdResponse(res, newItem, 'Absensi token created successfully');
    } catch (error) {
        console.error('Create absensi token error:', error);
        errorResponse(res, 'Failed to create absensi token');
    }
}

export async function updateAbsensiToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: absensiToken.id })
            .from(absensiToken)
            .where(
                and(
                    eq(absensiToken.id, id),
                    isNull(absensiToken.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Absensi token not found');
            return;
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (data.expiresAt) {
            updateData.expiresAt = new Date(data.expiresAt);
        }
        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        const [updated] = await db
            .update(absensiToken)
            .set(updateData)
            .where(eq(absensiToken.id, id))
            .returning();

        successResponse(res, updated, 'Absensi token updated successfully');
    } catch (error) {
        console.error('Update absensi token error:', error);
        errorResponse(res, 'Failed to update absensi token');
    }
}

export async function deleteAbsensiToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: absensiToken.id })
            .from(absensiToken)
            .where(
                and(
                    eq(absensiToken.id, id),
                    isNull(absensiToken.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Absensi token not found');
            return;
        }

        // Hard delete
        await db
            .delete(absensiToken)
            .where(eq(absensiToken.id, id));

        successResponse(res, null, 'Absensi token deleted successfully');
    } catch (error) {
        console.error('Delete absensi token error:', error);
        errorResponse(res, 'Failed to delete absensi token');
    }
}

// Regenerate QR code for existing token
export async function regenerateQRCode(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: absensiToken.id, token: absensiToken.token, kegiatanId: absensiToken.kegiatanId })
            .from(absensiToken)
            .where(
                and(
                    eq(absensiToken.id, id),
                    isNull(absensiToken.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Absensi token not found');
            return;
        }

        const qrData = JSON.stringify({
            token: existing.token,
            kegiatanId: existing.kegiatanId,
        });
        const qrCode = await generateQRCode(qrData);

        const [updated] = await db
            .update(absensiToken)
            .set({ qrCode, updatedAt: new Date() })
            .where(eq(absensiToken.id, id))
            .returning();

        successResponse(res, updated, 'QR code regenerated successfully');
    } catch (error) {
        console.error('Regenerate QR code error:', error);
        errorResponse(res, 'Failed to regenerate QR code');
    }
}
