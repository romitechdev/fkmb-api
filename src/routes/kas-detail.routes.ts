import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getKasDetails,
    getKasDetailById,
    getKasDetailsByKas,
    createKasDetail,
    updateKasDetail,
    deleteKasDetail,
    createKasDetailSchema,
    updateKasDetailSchema,
} from '../controllers/kas-detail.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });
const kasIdParamSchema = z.object({ kasId: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - admin and bendahara
router.get('/', requireRole('admin', 'bendahara'), getKasDetails);
router.get('/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), getKasDetailById);
router.get('/kas/:kasId', requireRole('admin', 'bendahara'), validateParams(kasIdParamSchema), getKasDetailsByKas);

// Create/Update - admin and bendahara
router.post('/', requireRole('admin', 'bendahara'), validateBody(createKasDetailSchema), createKasDetail);
router.put('/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), validateBody(updateKasDetailSchema), updateKasDetail);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteKasDetail);

export default router;
