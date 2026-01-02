import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard stats - for admin, pengurus, bendahara
router.get('/stats', requireRole('admin', 'pengurus', 'bendahara'), getDashboardStats);

export default router;
