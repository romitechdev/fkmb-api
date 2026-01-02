import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    createRoleSchema,
    updateRoleSchema,
} from '../controllers/roles.controller.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const router = Router();

// All routes require authentication + admin
router.use(authMiddleware);
router.use(adminOnly);

// CRUD routes
router.get('/', getRoles);
router.get('/:id', validateParams(idParamSchema), getRoleById);
router.post('/', validateBody(createRoleSchema), createRole);
router.put('/:id', validateParams(idParamSchema), validateBody(updateRoleSchema), updateRole);
router.delete('/:id', validateParams(idParamSchema), deleteRole);

export default router;
