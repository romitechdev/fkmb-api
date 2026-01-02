import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getDepartemen,
    getDepartemenById,
    getDepartemenMembers,
    createDepartemen,
    updateDepartemen,
    deleteDepartemen,
    createDepartemenSchema,
    updateDepartemenSchema,
} from '../controllers/departemen.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read routes - accessible by all authenticated users
router.get('/', getDepartemen);
router.get('/:id', validateParams(idParamSchema), getDepartemenById);
router.get('/:id/members', validateParams(idParamSchema), getDepartemenMembers);

// Write routes - admin only
router.post('/', requireRole('admin'), validateBody(createDepartemenSchema), createDepartemen);
router.put('/:id', requireRole('admin'), validateParams(idParamSchema), validateBody(updateDepartemenSchema), updateDepartemen);
router.delete('/:id', requireRole('admin'), validateParams(idParamSchema), deleteDepartemen);

export default router;
