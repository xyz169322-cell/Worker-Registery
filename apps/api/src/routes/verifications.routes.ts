import { Router } from 'express';
import { createVerification, getVerifications, getPendingQueue } from '../controllers/verifications.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(verifyToken);

router.get('/pending', checkRole('dept_officer'), getPendingQueue);
router.post('/:entityType/:entityId', checkRole('wwb_admin', 'dept_officer', 'super_admin'), createVerification);
router.get('/:entityType/:entityId', getVerifications);

export default router;
