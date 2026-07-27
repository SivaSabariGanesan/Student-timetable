import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, changePassword } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

// V3 [Critical]: Dedicated, tight rate limiter for the login endpoint.
// The global /api/ limiter allows 500 requests per 15 min — far too permissive
// for credential submission. This limiter allows 10 attempts per IP per 15 min,
// which stops online brute-force while not inconveniencing legitimate users.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed/errored attempts toward the cap
});

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router;
