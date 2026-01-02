import { Response } from 'express';
import { db } from '../config/database.js';
import { absensi, absensiToken, users, kegiatan } from '../db/schema/index.js';
import { eq, and, isNull, asc, desc, sql, gt } from 'drizzle-orm';
import {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
    badRequestResponse,
} from '../utils/response.js';
import { AuthRequest, PaginationQuery } from '../types/index.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { z } from 'zod';
import * as XLSX from 'xlsx';

// Validation schemas
export const createAbsensiSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export const createAbsensiManualSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    kegiatanId: z.string().uuid('Invalid kegiatan ID'),
    status: z.enum(['hadir', 'izin', 'sakit', 'alpha']).default('hadir'),
    tokenLabel: z.string().max(255).optional(),
    note: z.string().optional(),
});

export const updateAbsensiSchema = z.object({
    status: z.enum(['hadir', 'izin', 'sakit', 'alpha']).optional(),
    note: z.string().nullable().optional(),
});

// Controllers
export async function getAbsensi(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & {
            kegiatanId?: string;
            userId?: string;
            status?: string;
        };
        const { page, limit, offset } = parsePagination(query);

        let whereClause = isNull(absensi.deletedAt);

        if (query.kegiatanId) {
            whereClause = and(whereClause, eq(absensi.kegiatanId, query.kegiatanId))!;
        }

        if (query.userId) {
            whereClause = and(whereClause, eq(absensi.userId, query.userId))!;
        }

        if (query.status) {
            whereClause = and(whereClause, eq(absensi.status, query.status as 'hadir' | 'izin' | 'sakit' | 'alpha'))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(absensi)
            .where(whereClause);

        const list = await db
            .select({
                id: absensi.id,
                userId: absensi.userId,
                kegiatanId: absensi.kegiatanId,
                tokenId: absensi.tokenId,
                tokenLabel: absensi.tokenLabel,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
                note: absensi.note,
                createdAt: absensi.createdAt,
                updatedAt: absensi.updatedAt,
                userName: users.name,
                userNim: users.nim,
                kegiatanName: kegiatan.name,
            })
            .from(absensi)
            .leftJoin(users, eq(absensi.userId, users.id))
            .leftJoin(kegiatan, eq(absensi.kegiatanId, kegiatan.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(absensi.checkInTime) : desc(absensi.checkInTime))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Absensi retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get absensi error:', error);
        errorResponse(res, 'Failed to get absensi');
    }
}

export async function getAbsensiById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: absensi.id,
                userId: absensi.userId,
                kegiatanId: absensi.kegiatanId,
                tokenId: absensi.tokenId,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
                note: absensi.note,
                createdAt: absensi.createdAt,
                updatedAt: absensi.updatedAt,
                userName: users.name,
                userNim: users.nim,
                userEmail: users.email,
                kegiatanName: kegiatan.name,
            })
            .from(absensi)
            .leftJoin(users, eq(absensi.userId, users.id))
            .leftJoin(kegiatan, eq(absensi.kegiatanId, kegiatan.id))
            .where(
                and(
                    eq(absensi.id, id),
                    isNull(absensi.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Absensi not found');
            return;
        }

        successResponse(res, item, 'Absensi retrieved successfully');
    } catch (error) {
        console.error('Get absensi error:', error);
        errorResponse(res, 'Failed to get absensi');
    }
}

export async function getAbsensiByUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { userId } = req.params;
        const query = req.query as PaginationQuery;
        const { page, limit, offset } = parsePagination(query);

        const whereClause = and(
            isNull(absensi.deletedAt),
            eq(absensi.userId, userId)
        );

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(absensi)
            .where(whereClause);

        const list = await db
            .select({
                id: absensi.id,
                kegiatanId: absensi.kegiatanId,
                tokenLabel: absensi.tokenLabel,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
                note: absensi.note,
                createdAt: absensi.createdAt,
                kegiatanName: kegiatan.name,
                kegiatanDate: kegiatan.startDate,
            })
            .from(absensi)
            .leftJoin(kegiatan, eq(absensi.kegiatanId, kegiatan.id))
            .where(whereClause)
            .orderBy(desc(absensi.checkInTime))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'User absensi retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get user absensi error:', error);
        errorResponse(res, 'Failed to get user absensi');
    }
}

export async function getAbsensiByKegiatan(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { kegiatanId } = req.params;
        const query = req.query as PaginationQuery;
        const { page, limit, offset } = parsePagination(query);

        const whereClause = and(
            isNull(absensi.deletedAt),
            eq(absensi.kegiatanId, kegiatanId)
        );

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(absensi)
            .where(whereClause);

        const list = await db
            .select({
                id: absensi.id,
                userId: absensi.userId,
                tokenLabel: absensi.tokenLabel,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
                note: absensi.note,
                createdAt: absensi.createdAt,
                userName: users.name,
                userNim: users.nim,
            })
            .from(absensi)
            .leftJoin(users, eq(absensi.userId, users.id))
            .where(whereClause)
            .orderBy(asc(users.name))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Kegiatan absensi retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kegiatan absensi error:', error);
        errorResponse(res, 'Failed to get kegiatan absensi');
    }
}

// Scan QR code to create absensi
export async function createAbsensiByToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { token: rawToken } = req.body;
        const userId = req.user!.id;

        // Normalize token: trim whitespace and convert to uppercase for case-insensitive match
        const token = (rawToken || '').trim().toUpperCase();

        if (!token) {
            badRequestResponse(res, 'Token tidak boleh kosong');
            return;
        }

        // Find valid token with kegiatan name and label (case-insensitive match)
        const [tokenData] = await db
            .select({
                id: absensiToken.id,
                kegiatanId: absensiToken.kegiatanId,
                kegiatanName: kegiatan.name,
                label: absensiToken.label,
            })
            .from(absensiToken)
            .leftJoin(kegiatan, eq(absensiToken.kegiatanId, kegiatan.id))
            .where(
                and(
                    sql`UPPER(${absensiToken.token}) = ${token}`,
                    eq(absensiToken.isActive, true),
                    gt(absensiToken.expiresAt, new Date()),
                    isNull(absensiToken.deletedAt)
                )
            )
            .limit(1);

        if (!tokenData) {
            badRequestResponse(res, 'Token tidak valid atau sudah kadaluarsa');
            return;
        }

        // Check if already checked in for this specific token/pertemuan
        const [existingAbsensi] = await db
            .select({ id: absensi.id })
            .from(absensi)
            .where(
                and(
                    eq(absensi.userId, userId),
                    eq(absensi.tokenId, tokenData.id),
                    isNull(absensi.deletedAt)
                )
            )
            .limit(1);

        if (existingAbsensi) {
            badRequestResponse(res, 'Anda sudah absen untuk pertemuan ini');
            return;
        }

        const [newAbsensi] = await db
            .insert(absensi)
            .values({
                userId,
                kegiatanId: tokenData.kegiatanId,
                tokenId: tokenData.id,
                tokenLabel: tokenData.label || null,
                status: 'hadir',
                checkInTime: new Date(),
            })
            .returning();

        // Return with kegiatan name and label
        createdResponse(res, {
            ...newAbsensi,
            kegiatanName: tokenData.kegiatanName,
            tokenLabel: tokenData.label,
        }, 'Absensi berhasil dicatat');
    } catch (error) {
        console.error('Create absensi by token error:', error);
        errorResponse(res, 'Gagal mencatat absensi');
    }
}

// Manual absensi creation by admin/pengurus
export async function createAbsensiManual(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        // Check if already exists
        const [existing] = await db
            .select({ id: absensi.id })
            .from(absensi)
            .where(
                and(
                    eq(absensi.userId, data.userId),
                    eq(absensi.kegiatanId, data.kegiatanId),
                    isNull(absensi.deletedAt)
                )
            )
            .limit(1);

        if (existing) {
            badRequestResponse(res, 'Absensi already exists for this user and event');
            return;
        }

        const [newAbsensi] = await db
            .insert(absensi)
            .values({
                userId: data.userId,
                kegiatanId: data.kegiatanId,
                status: data.status,
                tokenLabel: data.tokenLabel || null,
                note: data.note,
                checkInTime: new Date(),
            })
            .returning();

        createdResponse(res, newAbsensi, 'Absensi created successfully');
    } catch (error) {
        console.error('Create absensi manual error:', error);
        errorResponse(res, 'Failed to create absensi');
    }
}

export async function updateAbsensi(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: absensi.id })
            .from(absensi)
            .where(
                and(
                    eq(absensi.id, id),
                    isNull(absensi.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Absensi not found');
            return;
        }

        const [updated] = await db
            .update(absensi)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(absensi.id, id))
            .returning();

        successResponse(res, updated, 'Absensi updated successfully');
    } catch (error) {
        console.error('Update absensi error:', error);
        errorResponse(res, 'Failed to update absensi');
    }
}

export async function deleteAbsensi(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: absensi.id })
            .from(absensi)
            .where(
                and(
                    eq(absensi.id, id),
                    isNull(absensi.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Absensi not found');
            return;
        }

        // Hard delete
        await db
            .delete(absensi)
            .where(eq(absensi.id, id));

        successResponse(res, null, 'Absensi deleted successfully');
    } catch (error) {
        console.error('Delete absensi error:', error);
        errorResponse(res, 'Failed to delete absensi');
    }
}

// Export absensi to Excel
export async function exportAbsensi(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { kegiatanId } = req.params;

        // Get kegiatan info
        const [kegiatanData] = await db
            .select({ name: kegiatan.name, startDate: kegiatan.startDate })
            .from(kegiatan)
            .where(eq(kegiatan.id, kegiatanId))
            .limit(1);

        if (!kegiatanData) {
            notFoundResponse(res, 'Kegiatan not found');
            return;
        }

        // Get absensi data
        const absensiList = await db
            .select({
                id: absensi.id,
                userName: users.name,
                userNim: users.nim,
                userEmail: users.email,
                tokenLabel: absensi.tokenLabel,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
                note: absensi.note,
            })
            .from(absensi)
            .leftJoin(users, eq(absensi.userId, users.id))
            .where(
                and(
                    eq(absensi.kegiatanId, kegiatanId),
                    isNull(absensi.deletedAt)
                )
            )
            .orderBy(asc(users.name));

        // Transform data for Excel
        const excelData = absensiList.map((item, index) => ({
            'No': index + 1,
            'Nama': item.userName || '-',
            'NIM': item.userNim || '-',
            'Email': item.userEmail || '-',
            'Pertemuan': item.tokenLabel || '-',
            'Status': item.status.toUpperCase(),
            'Waktu Check-in': item.checkInTime ? new Date(item.checkInTime).toLocaleString('id-ID') : '-',
            'Catatan': item.note || '-',
        }));

        // Create summary
        const summary = {
            hadir: absensiList.filter(a => a.status === 'hadir').length,
            izin: absensiList.filter(a => a.status === 'izin').length,
            sakit: absensiList.filter(a => a.status === 'sakit').length,
            alpha: absensiList.filter(a => a.status === 'alpha').length,
            total: absensiList.length,
        };

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Data sheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 25 }, // Nama
            { wch: 15 }, // NIM
            { wch: 30 }, // Email
            { wch: 10 }, // Status
            { wch: 20 }, // Waktu Check-in
            { wch: 30 }, // Catatan
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Absensi');

        // Summary sheet
        const summaryData = [
            { 'Keterangan': 'Nama Kegiatan', 'Jumlah': kegiatanData.name },
            { 'Keterangan': 'Tanggal', 'Jumlah': kegiatanData.startDate ? new Date(kegiatanData.startDate).toLocaleDateString('id-ID') : '-' },
            { 'Keterangan': '', 'Jumlah': '' },
            { 'Keterangan': 'Hadir', 'Jumlah': summary.hadir },
            { 'Keterangan': 'Izin', 'Jumlah': summary.izin },
            { 'Keterangan': 'Sakit', 'Jumlah': summary.sakit },
            { 'Keterangan': 'Alpha', 'Jumlah': summary.alpha },
            { 'Keterangan': 'Total', 'Jumlah': summary.total },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        const filename = `absensi-${kegiatanData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export absensi error:', error);
        errorResponse(res, 'Failed to export absensi');
    }
}
