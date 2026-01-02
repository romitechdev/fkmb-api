import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getKas,
    getKasById,
    getActiveKas,
    createKas,
    updateKas,
    deleteKas,
    createKasSchema,
    updateKasSchema,
} from '../controllers/kas.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - admin and bendahara
router.get('/', requireRole('admin', 'bendahara'), getKas);
router.get('/active', requireRole('admin', 'bendahara'), getActiveKas);
router.get('/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), getKasById);

// Create - admin only
router.post('/', requireRole('admin'), validateBody(createKasSchema), createKas);

// Update - admin and bendahara
router.put('/:id', requireRole('admin', 'bendahara'), validateParams(idParamSchema), validateBody(updateKasSchema), updateKas);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteKas);

export default router;
