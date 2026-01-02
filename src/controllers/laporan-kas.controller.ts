import { Response } from 'express';
import { db } from '../config/database.js';
import { laporanKas, kas, kasDetail, users } from '../db/schema/index.js';
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
import * as XLSX from 'xlsx';

// Validation schemas
export const createLaporanKasSchema = z.object({
    kasId: z.string().uuid('Invalid kas ID'),
    periode: z.string().min(1, 'Periode is required').max(50),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const updateLaporanKasSchema = z.object({
    periode: z.string().min(1).max(50).optional(),
    fileUrl: z.string().nullable().optional(),
});

// Controllers
export async function getLaporanKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & { kasId?: string };
        const { page, limit, offset } = parsePagination(query);

        let whereClause = isNull(laporanKas.deletedAt);

        if (query.kasId) {
            whereClause = and(whereClause, eq(laporanKas.kasId, query.kasId))!;
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(laporanKas)
            .where(whereClause);

        const list = await db
            .select({
                id: laporanKas.id,
                kasId: laporanKas.kasId,
                periode: laporanKas.periode,
                totalPemasukan: laporanKas.totalPemasukan,
                totalPengeluaran: laporanKas.totalPengeluaran,
                saldoAwal: laporanKas.saldoAwal,
                saldoAkhir: laporanKas.saldoAkhir,
                fileUrl: laporanKas.fileUrl,
                generatedBy: laporanKas.generatedBy,
                createdAt: laporanKas.createdAt,
                updatedAt: laporanKas.updatedAt,
                kasPeriode: kas.periode,
                generatorName: users.name,
            })
            .from(laporanKas)
            .leftJoin(kas, eq(laporanKas.kasId, kas.id))
            .leftJoin(users, eq(laporanKas.generatedBy, users.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'asc' ? asc(laporanKas.createdAt) : desc(laporanKas.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, list, 'Laporan kas retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get laporan kas error:', error);
        errorResponse(res, 'Failed to get laporan kas');
    }
}

export async function getLaporanKasById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [item] = await db
            .select({
                id: laporanKas.id,
                kasId: laporanKas.kasId,
                periode: laporanKas.periode,
                totalPemasukan: laporanKas.totalPemasukan,
                totalPengeluaran: laporanKas.totalPengeluaran,
                saldoAwal: laporanKas.saldoAwal,
                saldoAkhir: laporanKas.saldoAkhir,
                fileUrl: laporanKas.fileUrl,
                generatedBy: laporanKas.generatedBy,
                createdAt: laporanKas.createdAt,
                updatedAt: laporanKas.updatedAt,
                kasPeriode: kas.periode,
                generatorName: users.name,
            })
            .from(laporanKas)
            .leftJoin(kas, eq(laporanKas.kasId, kas.id))
            .leftJoin(users, eq(laporanKas.generatedBy, users.id))
            .where(
                and(
                    eq(laporanKas.id, id),
                    isNull(laporanKas.deletedAt)
                )
            )
            .limit(1);

        if (!item) {
            notFoundResponse(res, 'Laporan kas not found');
            return;
        }

        successResponse(res, item, 'Laporan kas retrieved successfully');
    } catch (error) {
        console.error('Get laporan kas error:', error);
        errorResponse(res, 'Failed to get laporan kas');
    }
}

export async function createLaporanKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;
        const generatedById = req.user?.id;

        // Verify kas exists and get saldo awal
        const [kasData] = await db
            .select({ id: kas.id, saldoAwal: kas.saldoAwal })
            .from(kas)
            .where(
                and(
                    eq(kas.id, data.kasId),
                    isNull(kas.deletedAt)
                )
            )
            .limit(1);

        if (!kasData) {
            notFoundResponse(res, 'Kas not found');
            return;
        }

        // Build filter for transactions
        let detailWhereClause = and(
            eq(kasDetail.kasId, data.kasId),
            isNull(kasDetail.deletedAt)
        );

        if (data.startDate) {
            detailWhereClause = and(detailWhereClause, gte(kasDetail.tanggal, data.startDate))!;
        }

        if (data.endDate) {
            detailWhereClause = and(detailWhereClause, lte(kasDetail.tanggal, data.endDate))!;
        }

        // Calculate totals
        const [totals] = await db
            .select({
                totalPemasukan: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pemasukan' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
                totalPengeluaran: sql<string>`COALESCE(SUM(CASE WHEN ${kasDetail.jenis} = 'pengeluaran' THEN ${kasDetail.jumlah}::numeric ELSE 0 END), 0)::text`,
            })
            .from(kasDetail)
            .where(detailWhereClause);

        const saldoAwal = parseFloat(kasData.saldoAwal as string);
        const totalPemasukan = parseFloat(totals?.totalPemasukan || '0');
        const totalPengeluaran = parseFloat(totals?.totalPengeluaran || '0');
        const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;

        const [newItem] = await db
            .insert(laporanKas)
            .values({
                kasId: data.kasId,
                periode: data.periode,
                totalPemasukan: totalPemasukan.toString(),
                totalPengeluaran: totalPengeluaran.toString(),
                saldoAwal: saldoAwal.toString(),
                saldoAkhir: saldoAkhir.toString(),
                generatedBy: generatedById,
            })
            .returning();

        createdResponse(res, newItem, 'Laporan kas generated successfully');
    } catch (error) {
        console.error('Create laporan kas error:', error);
        errorResponse(res, 'Failed to create laporan kas');
    }
}

export async function updateLaporanKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db
            .select({ id: laporanKas.id })
            .from(laporanKas)
            .where(
                and(
                    eq(laporanKas.id, id),
                    isNull(laporanKas.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Laporan kas not found');
            return;
        }

        const [updated] = await db
            .update(laporanKas)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(laporanKas.id, id))
            .returning();

        successResponse(res, updated, 'Laporan kas updated successfully');
    } catch (error) {
        console.error('Update laporan kas error:', error);
        errorResponse(res, 'Failed to update laporan kas');
    }
}

export async function deleteLaporanKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [existing] = await db
            .select({ id: laporanKas.id })
            .from(laporanKas)
            .where(
                and(
                    eq(laporanKas.id, id),
                    isNull(laporanKas.deletedAt)
                )
            )
            .limit(1);

        if (!existing) {
            notFoundResponse(res, 'Laporan kas not found');
            return;
        }

        // Hard delete
        await db
            .delete(laporanKas)
            .where(eq(laporanKas.id, id));

        successResponse(res, null, 'Laporan kas deleted successfully');
    } catch (error) {
        console.error('Delete laporan kas error:', error);
        errorResponse(res, 'Failed to delete laporan kas');
    }
}

// Export laporan kas to Excel
export async function exportLaporanKas(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Get laporan data
        const [laporan] = await db
            .select({
                id: laporanKas.id,
                periode: laporanKas.periode,
                totalPemasukan: laporanKas.totalPemasukan,
                totalPengeluaran: laporanKas.totalPengeluaran,
                saldoAwal: laporanKas.saldoAwal,
                saldoAkhir: laporanKas.saldoAkhir,
                kasId: laporanKas.kasId,
                kasPeriode: kas.periode,
                createdAt: laporanKas.createdAt,
            })
            .from(laporanKas)
            .leftJoin(kas, eq(laporanKas.kasId, kas.id))
            .where(
                and(
                    eq(laporanKas.id, id),
                    isNull(laporanKas.deletedAt)
                )
            )
            .limit(1);

        if (!laporan) {
            notFoundResponse(res, 'Laporan kas not found');
            return;
        }

        // Get kas detail transactions
        const transactions = await db
            .select({
                id: kasDetail.id,
                tanggal: kasDetail.tanggal,
                jenis: kasDetail.jenis,
                kategori: kasDetail.kategori,
                description: kasDetail.description,
                jumlah: kasDetail.jumlah,
                creatorName: users.name,
            })
            .from(kasDetail)
            .leftJoin(users, eq(kasDetail.createdBy, users.id))
            .where(
                and(
                    eq(kasDetail.kasId, laporan.kasId),
                    isNull(kasDetail.deletedAt)
                )
            )
            .orderBy(asc(kasDetail.tanggal));

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            { 'Keterangan': 'Periode Laporan', 'Nilai': laporan.periode },
            { 'Keterangan': 'Periode Kas', 'Nilai': laporan.kasPeriode || '-' },
            { 'Keterangan': 'Tanggal Generate', 'Nilai': new Date(laporan.createdAt!).toLocaleDateString('id-ID') },
            { 'Keterangan': '', 'Nilai': '' },
            { 'Keterangan': 'Saldo Awal', 'Nilai': `Rp ${Number(laporan.saldoAwal).toLocaleString('id-ID')}` },
            { 'Keterangan': 'Total Pemasukan', 'Nilai': `Rp ${Number(laporan.totalPemasukan).toLocaleString('id-ID')}` },
            { 'Keterangan': 'Total Pengeluaran', 'Nilai': `Rp ${Number(laporan.totalPengeluaran).toLocaleString('id-ID')}` },
            { 'Keterangan': 'Saldo Akhir', 'Nilai': `Rp ${Number(laporan.saldoAkhir).toLocaleString('id-ID')}` },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

        // Transactions sheet
        const transactionsData = transactions.map((t, index) => ({
            'No': index + 1,
            'Tanggal': new Date(t.tanggal).toLocaleDateString('id-ID'),
            'Jenis': t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
            'Kategori': t.kategori || '-',
            'Keterangan': t.description,
            'Jumlah': Number(t.jumlah),
            'Dicatat Oleh': t.creatorName || '-',
        }));
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
        transactionsSheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 15 }, // Tanggal
            { wch: 12 }, // Jenis
            { wch: 15 }, // Kategori
            { wch: 35 }, // Keterangan
            { wch: 15 }, // Jumlah
            { wch: 20 }, // Dicatat Oleh
        ];
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transaksi');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        const filename = `laporan-kas-${laporan.periode.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export laporan kas error:', error);
        errorResponse(res, 'Failed to export laporan kas');
    }
}
