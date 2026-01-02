import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getKegiatan,
    getKegiatanById,
    createKegiatan,
    updateKegiatan,
    deleteKegiatan,
    createKegiatanSchema,
    updateKegiatanSchema,
} from '../controllers/kegiatan.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - accessible by all authenticated users
router.get('/', getKegiatan);
router.get('/:id', validateParams(idParamSchema), getKegiatanById);

// Create/Update - admin and pengurus
router.post('/', requireRole('admin', 'pengurus'), validateBody(createKegiatanSchema), createKegiatan);
router.put('/:id', requireRole('admin', 'pengurus'), validateParams(idParamSchema), validateBody(updateKegiatanSchema), updateKegiatan);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteKegiatan);

export default router;
