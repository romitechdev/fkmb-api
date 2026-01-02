import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole, requireSelfOrRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getAbsensi,
    getAbsensiById,
    getAbsensiByUser,
    getAbsensiByKegiatan,
    createAbsensiByToken,
    createAbsensiManual,
    updateAbsensi,
    deleteAbsensi,
    exportAbsensi,
    createAbsensiSchema,
    createAbsensiManualSchema,
    updateAbsensiSchema,
} from '../controllers/absensi.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });
const userIdParamSchema = z.object({ userId: z.string().uuid() });
const kegiatanIdParamSchema = z.object({ kegiatanId: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Export route (must be before /:id)
router.get('/export/:kegiatanId', validateParams(kegiatanIdParamSchema), requireRole('admin', 'pengurus'), exportAbsensi);

// Read routes
router.get('/', requireRole('admin', 'pengurus'), getAbsensi);
router.get('/:id', validateParams(idParamSchema), getAbsensiById);
router.get('/user/:userId', validateParams(userIdParamSchema), requireSelfOrRole('admin', 'pengurus'), getAbsensiByUser);
router.get('/kegiatan/:kegiatanId', validateParams(kegiatanIdParamSchema), requireRole('admin', 'pengurus'), getAbsensiByKegiatan);

// Create - QR scan for all, manual for admin/pengurus
router.post('/scan', validateBody(createAbsensiSchema), createAbsensiByToken);
router.post('/manual', requireRole('admin', 'pengurus'), validateBody(createAbsensiManualSchema), createAbsensiManual);

// Update - admin and pengurus
router.put('/:id', requireRole('admin', 'pengurus'), validateParams(idParamSchema), validateBody(updateAbsensiSchema), updateAbsensi);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteAbsensi);

export default router;
