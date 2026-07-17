import { Router } from 'express';
import { resetDemoData } from '../controllers/admin.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.post('/reset-seed', checkRole('super_admin'), resetDemoData);

export default router;
