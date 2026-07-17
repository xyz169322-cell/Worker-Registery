import { Router } from 'express';
import { checkCnic, registerWorker, getWorkerById, getAllWorkers, getMe } from '../controllers/workers.controller';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { verifyToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

// These routes are public since workers are registering themselves
router.post('/public/check-cnic', apiLimiter, checkCnic);
router.post('/public/register', apiLimiter, registerWorker);

// Protected routes
router.get('/me', verifyToken, checkRole('worker'), getMe);
router.get('/', verifyToken, checkRole('super_admin', 'wwb_admin'), getAllWorkers);
router.get('/:id', verifyToken, checkRole('super_admin', 'wwb_admin'), getWorkerById);

export default router;
