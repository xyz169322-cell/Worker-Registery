import { Router } from 'express';
import { login, refresh, logout, me, phoneLogin, sendOtp, verifyOtp } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { apiLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/login', apiLimiter, auditLog('LOGIN'), login);
router.post('/phone-login', apiLimiter, auditLog('PHONE_LOGIN'), phoneLogin);
router.post('/send-otp', apiLimiter, sendOtp);
router.post('/verify-otp', apiLimiter, verifyOtp);
router.post('/refresh', apiLimiter, refresh);
router.post('/logout', verifyToken, auditLog('LOGOUT'), logout);
router.get('/me', verifyToken, me);

export default router;
