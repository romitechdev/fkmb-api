import { Response } from 'express';
import { db } from '../config/database.js';
import { kasDetail, kas, users } from '../db/schema/index.js';
import { eq, and, isNull, sql, asc, desc, gte, lte } from 'drizzle-orm';
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
export const createKasDetailSchema = z.object({
    kasId: z.string().uuid('Invalid kas ID'),
    tanggal: z.string().min(1, 'Tanggal is required'),
    jenis: z.enum(['pemasukan', 'pengeluaran']),
    kategori: z.string().max(100).optional(),
    description: z.string().min(1, 'Description is required'),
    jumlah: z.string().or(z.number()).transform(String),
    bukti: z.string().optional(),
});

export const updateKasDetailSchema = z.object({
    tanggal: z.string().optional(),
    jenis: z.enum(['pemasukan', 'pengeluaran']).optional(),
    kategori: z.string().max(100).nullable().optional(),
    description: z.string().min(1).optional(),
    jumlah: z.string().or(z.number()).transform(String).optional(),
    bukti: z.string().nullable().optional(),
});

// Helper to update kas saldo
async function updateKasSaldo(kasId: string): Promise<void> {
    // Calculate totals
    const [totals] = await db
        .select({
            pemasukan: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pemasukan' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
            pengeluaran: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pengeluaran' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
        })
        .from(kasDetail)
        .where(
            and(
                eq(kasDetail.kasId, kasId),
                isNull(kasDetail.deletedAt)
            )
        );

    // Get saldo awal
    const [kasData] = await db
        .select({ saldoAwal: kas.saldoAwal })
        .from(kas)
        .where(eq(kas.id, kasId))
        .limit(1);

    if (kasData) {
        const saldoAwal = parseFloat(kasData.saldoAwal as string);
        const pemasukan = parseFloat(totals?.pemasukan || '0');
        const pengeluaran = parseFloat(totals?.pengeluaran || '0');
        const saldoAkhir = saldoAwal + pemasukan - pengeluaran;

        await db
            .update(kas)
            .set({
                saldoAkhir: saldoAkhir.toString(),
                updatedAt: new Date()
            })
            .where(eq(kas.id, kasId));
    }
}

// Controllers
export async function getKasDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & {
            kasId?: string;
            jenis?: string;
            startDate?: string;
            endDate?: string;
            kategori?: string;
        };
        const { page, limit, offset } = parsePagination(query);

        let whereClause = isNull(kasDetail.deletedAt);

        if (query.kasId) {
            whereClause = and(whereClause, eq(kasDetail.kasId, query.kasId))!;
        }

        if (query.jenis) {
            whereClause = and(whereClause, eq(kasDetail.jenis, query.jenis as 'pemasukan' | 'pengeluaran'))!;
        }

        if (query.startDate) {
            whereClause = and(whereClause, gte(kasDetail.tanggal, query.startDate))!;
        }

        if (query.endDate) {
            whereClause = and(whereClause, lte(kasDetail.tanggal, query.endDate))!;
        }

        if (query.kategori) {
            whereClause = and(whereClause, eq(kasDetail.kategori, query.kategori))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(kasDetail)
            .where(whereClause);

        const list = await db
            .select({
                id: kasDetail.id,
                kasId: kasDetail.kasId,
                tanggal: kasDetail.tanggal,
                jenis: kasDetail.jenis,
                kategori: kasDetail.kategori,
                description: kasDetail.description,
                jumlah: kasDetail.jumlah,
                bukti: kasDetail.bukti,
                createdBy: kasDetail.createdBy,
                createdAt: kasDetail.createdAt,
                updatedAt: kasDetail.updatedAt,
                creatorName: users.name,
                kasPeriode: kas.periode,
            })
            .from(kasDetail)
            .leftJoin(kas, eq(kasDetail.kasId, kas.id))
            .leftJoin(users, eq(kasDetail.createdBy, users.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(kasDetail.tanggal) : desc(kasDetail.tanggal))
            .limit(limit)
            .offset(offset);

        // Get summary
        const [summary] = await db
            .select({
                totalPemasukan: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pemasukan' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
                totalPengeluaran: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pengeluaran' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
            })
            .from(kasDetail)
            .where(whereClause);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, {
            transactions: list,
            summary: {
                totalPemasukan: summary?.totalPemasukan || '0',
                totalPengeluaran: summary?.totalPengeluaran || '0',
            }
        }, 'Kas details retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kas details error:', error);
        errorResponse(res, 'Failed to get kas details');
    }
}

export async function getKasDetailById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: kasDetail.id,
                kasId: kasDetail.kasId,
                tanggal: kasDetail.tanggal,
                jenis: kasDetail.jenis,
                kategori: kasDetail.kategori,
                description: kasDetail.description,
                jumlah: kasDetail.jumlah,
                bukti: kasDetail.bukti,
                createdBy: kasDetail.createdBy,
                createdAt: kasDetail.createdAt,
                updatedAt: kasDetail.updatedAt,
                creatorName: users.name,
                kasPeriode: kas.periode,
            })
            .from(kasDetail)
            .leftJoin(kas, eq(kasDetail.kasId, kas.id))
            .leftJoin(users, eq(kasDetail.createdBy, users.id))
            .where(
                and(
                    eq(kasDetail.id, id),
                    isNull(kasDetail.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Kas detail not found');
            return;
        }

        successResponse(res, item, 'Kas detail retrieved successfully');
    } catch (error) {
        console.error('Get kas detail error:', error);
        errorResponse(res, 'Failed to get kas detail');
    }
}

export async function getKasDetailsByKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { kasId } = req.params;
        const query = req.query as PaginationQuery;
        const { page, limit, offset } = parsePagination(query);

        const whereClause = and(
            isNull(kasDetail.deletedAt),
            eq(kasDetail.kasId, kasId)
        );

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(kasDetail)
            .where(whereClause);

        const list = await db
            .select({
                id: kasDetail.id,
                tanggal: kasDetail.tanggal,
                jenis: kasDetail.jenis,
                kategori: kasDetail.kategori,
                description: kasDetail.description,
                jumlah: kasDetail.jumlah,
                bukti: kasDetail.bukti,
                createdAt: kasDetail.createdAt,
                creatorName: users.name,
            })
            .from(kasDetail)
            .leftJoin(users, eq(kasDetail.createdBy, users.id))
            .where(whereClause)
            .orderBy(desc(kasDetail.tanggal))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Kas details retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get kas details by kas error:', error);
        errorResponse(res, 'Failed to get kas details');
    }
}

export async function createKasDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;
        const createdById = req.user?.id;

        // Verify kas exists
        const [kasExists] = await db
            .select({ id: kas.id })
            .from(kas)
            .where(
                and(
                    eq(kas.id, data.kasId),
                    isNull(kas.deletedAt)
                )
            )
            .limit(1);

        if (!kasExists) {
            notFoundResponse(res, 'Kas not found');
            return;
        }

        // Use transaction
        const [newItem] = await db
            .insert(kasDetail)
            .values({
                kasId: data.kasId,
                tanggal: data.tanggal,
                jenis: data.jenis,
                kategori: data.kategori,
                description: data.description,
                jumlah: data.jumlah,
                bukti: data.bukti,
                createdBy: createdById,
            })
            .returning();

        // Update kas saldo
        await updateKasSaldo(data.kasId);

        createdResponse(res, newItem, 'Kas detail created successfully');
    } catch (error) {
        console.error('Create kas detail error:', error);
        errorResponse(res, 'Failed to create kas detail');
    }
}

export async function updateKasDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: kasDetail.id, kasId: kasDetail.kasId })
            .from(kasDetail)
            .where(
                and(
                    eq(kasDetail.id, id),
                    isNull(kasDetail.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kas detail not found');
            return;
        }

        const [updated] = await db
            .update(kasDetail)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(kasDetail.id, id))
            .returning();

        // Update kas saldo
        await updateKasSaldo(existing.kasId);

        successResponse(res, updated, 'Kas detail updated successfully');
    } catch (error) {
        console.error('Update kas detail error:', error);
        errorResponse(res, 'Failed to update kas detail');
    }
}

export async function deleteKasDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: kasDetail.id, kasId: kasDetail.kasId })
            .from(kasDetail)
            .where(
                and(
                    eq(kasDetail.id, id),
                    isNull(kasDetail.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Kas detail not found');
            return;
        }

        // Hard delete
        await db
            .delete(kasDetail)
            .where(eq(kasDetail.id, id));

        // Update kas saldo
        await updateKasSaldo(existing.kasId);

        successResponse(res, null, 'Kas detail deleted successfully');
    } catch (error) {
        console.error('Delete kas detail error:', error);
        errorResponse(res, 'Failed to delete kas detail');
    }
}
