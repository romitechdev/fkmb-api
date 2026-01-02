import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getLaporanKas,
    getLaporanKasById,
    createLaporanKas,
    updateLaporanKas,
    deleteLaporanKas,
    exportLaporanKas,
    createLaporanKasSchema,
    updateLaporanKasSchema,
} from '../controllers/laporan-kas.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Export route (must be before /:id)
router.get('/export/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), exportLaporanKas);

// Read routes - admin and bendahara
router.get('/', requireRole('admin', 'bendahara'), getLaporanKas);
router.get('/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), getLaporanKasById);

// Create - admin and bendahara
router.post('/', requireRole('admin', 'bendahara'), validateBody(createLaporanKasSchema), createLaporanKas);

// Update - admin only
router.put('/:id', requireRole('admin'), validateParams(idParamSchema), validateBody(updateLaporanKasSchema), updateLaporanKas);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteLaporanKas);

export default router;
