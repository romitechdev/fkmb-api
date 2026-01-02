import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import { upload } from '../services/file-upload.service.js';
import {
    getArsip,
    getArsipById,
    getCategories,
    createArsip,
    updateArsip,
    deleteArsip,
    createArsipSchema,
    updateArsipSchema,
} from '../controllers/arsip.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - accessible by all authenticated users
router.get('/', getArsip);
router.get('/categories', getCategories);
router.get('/:id', validateParams(idParamSchema), getArsipById);

// Create/Update - admin and pengurus
router.post(
    '/',
    requireRole('admin', 'pengurus'),
    upload.single('file'),
    validateBody(createArsipSchema),
    createArsip
);
router.put(
    '/:id',
    requireRole('admin', 'pengurus'),
    validateParams(idParamSchema),
    upload.single('file'),
    validateBody(updateArsipSchema),
    updateArsip
);

// Delete - admin only
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteArsip);

export default router;
