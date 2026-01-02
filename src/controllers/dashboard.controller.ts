import { Response } from 'express';
import { db } from '../config/database.js';
import { users, kegiatan, absensi, kas, kasDetail, departemen, kepengurusan, arsip } from '../db/schema/index.js';
import { eq, and, isNull, sql, gte, lt, count } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get counts in parallel
        const [
            usersCount,
            kegiatanCount,
            todayAbsensiCount,
            activeKas,
            departemenCount,
            arsipCount,
            kegiatanStatus,
            absensiStats,
            recentKegiatan,
            recentAbsensi,
        ] = await Promise.all([
            // Total users
            db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),

            // Total kegiatan
            db.select({ count: count() }).from(kegiatan).where(isNull(kegiatan.deletedAt)),

            // Today absensi
            db.select({ count: count() }).from(absensi).where(
                and(
                    isNull(absensi.deletedAt),
                    gte(absensi.checkInTime, today),
                    lt(absensi.checkInTime, tomorrow)
                )
            ),

            // Active kas with saldo
            db.select({
                id: kas.id,
                saldoAkhir: kas.saldoAkhir,
                periode: kas.periode,
            })
                .from(kas)
                .where(and(isNull(kas.deletedAt), eq(kas.isActive, true)))
                .limit(1),

            // Departemen count
            db.select({ count: count() }).from(departemen).where(isNull(departemen.deletedAt)),

            // Arsip count
            db.select({ count: count() }).from(arsip).where(isNull(arsip.deletedAt)),

            // Kegiatan by status
            db.select({
                status: kegiatan.status,
                count: count(),
            })
                .from(kegiatan)
                .where(isNull(kegiatan.deletedAt))
                .groupBy(kegiatan.status),

            // Absensi stats for current month
            db.select({
                status: absensi.status,
                count: count(),
            })
                .from(absensi)
                .where(
                    and(
                        isNull(absensi.deletedAt),
                        gte(absensi.checkInTime, new Date(today.getFullYear(), today.getMonth(), 1))
                    )
                )
                .groupBy(absensi.status),

            // Recent 5 kegiatan
            db.select({
                id: kegiatan.id,
                name: kegiatan.name,
                startDate: kegiatan.startDate,
                status: kegiatan.status,
                type: kegiatan.type,
            })
                .from(kegiatan)
                .where(isNull(kegiatan.deletedAt))
                .orderBy(sql`${kegiatan.startDate} DESC`)
                .limit(5),

            // Recent 5 absensi
            db.select({
                id: absensi.id,
                userName: users.name,
                kegiatanName: kegiatan.name,
                status: absensi.status,
                checkInTime: absensi.checkInTime,
            })
                .from(absensi)
                .leftJoin(users, eq(absensi.userId, users.id))
                .leftJoin(kegiatan, eq(absensi.kegiatanId, kegiatan.id))
                .where(isNull(absensi.deletedAt))
                .orderBy(sql`${absensi.checkInTime} DESC`)
                .limit(5),
        ]);

        // Transform kegiatan status to object
        const kegiatanByStatus = {
            upcoming: 0,
            ongoing: 0,
            completed: 0,
            cancelled: 0,
        };
        kegiatanStatus.forEach(item => {
            if (item.status in kegiatanByStatus) {
                kegiatanByStatus[item.status as keyof typeof kegiatanByStatus] = Number(item.count);
            }
        });

        // Transform absensi stats
        const absensiByStatus = {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpha: 0,
        };
        absensiStats.forEach(item => {
            if (item.status in absensiByStatus) {
                absensiByStatus[item.status as keyof typeof absensiByStatus] = Number(item.count);
            }
        });

        const dashboardData = {
            stats: {
                totalUsers: Number(usersCount[0].count),
                totalKegiatan: Number(kegiatanCount[0].count),
                todayAbsensi: Number(todayAbsensiCount[0].count),
                totalDepartemen: Number(departemenCount[0].count),
                totalArsip: Number(arsipCount[0].count),
                saldoKas: activeKas[0]?.saldoAkhir || '0',
                kasPeriode: activeKas[0]?.periode || null,
            },
            kegiatanByStatus,
            absensiByStatus,
            recentKegiatan,
            recentAbsensi,
        };

        successResponse(res, dashboardData, 'Dashboard data fetched successfully');
    } catch (error) {
        console.error('Dashboard stats error:', error);
        errorResponse(res, 'Failed to fetch dashboard data');
    }
}
