import { Router } from 'express';
import { getDashboardStats, getMyWorkers } from '../controllers/employers.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes and ensure only employers can access them
router.use(verifyToken);
router.use(checkRole('employer'));

router.get('/dashboard', getDashboardStats);
router.get('/workers', getMyWorkers);

export default router;
