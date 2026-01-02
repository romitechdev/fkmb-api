import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole, requireSelfOrRole } from '../middleware/rbac.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    exportUsers,
    importUsers,
    downloadTemplate,
    createUserSchema,
    updateUserSchema,
    idParamSchema,
} from '../controllers/users.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authMiddleware);

// Export/Import routes (must be before /:id routes)
router.get('/export', requireRole('admin'), exportUsers);
router.get('/template', requireRole('admin'), downloadTemplate);
router.post('/import', requireRole('admin'), upload.single('file'), importUsers);

// CRUD routes
router.get('/', requireRole('admin', 'pengurus'), getUsers);
router.get('/:id', validateParams(idParamSchema), requireSelfOrRole('admin'), getUserById);
router.post('/', requireRole('admin'), validateBody(createUserSchema), createUser);
router.put('/:id', validateParams(idParamSchema), requireSelfOrRole('admin'), validateBody(updateUserSchema), updateUser);
router.delete('/:id', validateParams(idParamSchema), requireRole('admin'), deleteUser);

export default router;
