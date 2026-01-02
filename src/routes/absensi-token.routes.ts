import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getAbsensiTokens,
    getAbsensiTokenById,
    createAbsensiToken,
    updateAbsensiToken,
    deleteAbsensiToken,
    regenerateQRCode,
    createAbsensiTokenSchema,
    updateAbsensiTokenSchema,
} from '../controllers/absensi-token.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - admin and pengurus
router.get('/', requireRole('admin', 'pengurus'), getAbsensiTokens);
router.get('/:id', requireRole('admin', 'pengurus'), validateParams(idParamSchema), getAbsensiTokenById);

// Create/Update - admin and pengurus
router.post('/', requireRole('admin', 'pengurus'), validateBody(createAbsensiTokenSchema), createAbsensiToken);
router.put('/:id', requireRole('admin', 'pengurus'), validateParams(idParamSchema), validateBody(updateAbsensiTokenSchema), updateAbsensiToken);
router.post('/:id/regenerate-qr', requireRole('admin', 'pengurus'), validateParams(idParamSchema), regenerateQRCode);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteAbsensiToken);

export default router;
