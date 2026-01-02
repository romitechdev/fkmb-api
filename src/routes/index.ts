import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import rolesRoutes from './roles.routes.js';
import departemenRoutes from './departemen.routes.js';
import kepengurusanRoutes from './kepengurusan.routes.js';
import kegiatanRoutes from './kegiatan.routes.js';
import absensiTokenRoutes from './absensi-token.routes.js';
import absensiRoutes from './absensi.routes.js';
import kasRoutes from './kas.routes.js';
import kasDetailRoutes from './kas-detail.routes.js';
import laporanKasRoutes from './laporan-kas.routes.js';
import arsipRoutes from './arsip.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/departemen', departemenRoutes);
router.use('/kepengurusan', kepengurusanRoutes);
router.use('/kegiatan', kegiatanRoutes);
router.use('/absensi-token', absensiTokenRoutes);
router.use('/absensi', absensiRoutes);
router.use('/kas', kasRoutes);
router.use('/kas-detail', kasDetailRoutes);
router.use('/laporan-kas', laporanKasRoutes);
router.use('/arsip', arsipRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'FKMB API is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
