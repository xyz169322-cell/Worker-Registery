import { Router } from 'express';
import { getSummary } from '../controllers/analytics.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/summary', checkRole('wwb_admin', 'super_admin', 'dept_officer'), getSummary);

export default router;
