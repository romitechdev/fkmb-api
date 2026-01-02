import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getKepengurusan,
    getKepengurusanById,
    createKepengurusan,
    updateKepengurusan,
    deleteKepengurusan,
    createKepengurusanSchema,
    updateKepengurusanSchema,
} from '../controllers/kepengurusan.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - admin and pengurus
router.get('/', requireRole('admin', 'pengurus'), getKepengurusan);
router.get('/:id', requireRole('admin', 'pengurus'), validateParams(idParamSchema), getKepengurusanById);

// Write routes - admin only
router.post('/', requireRole('admin'), validateBody(createKepengurusanSchema), createKepengurusan);
router.put('/:id', requireRole('admin'), validateParams(idParamSchema), validateBody(updateKepengurusanSchema), updateKepengurusan);
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteKepengurusan);

export default router;
