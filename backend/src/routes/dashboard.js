import { Router } from 'express';
import { dashboardStats } from '../controllers/dashboard.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// V2 [Critical]: Require authentication to access dashboard statistics.
router.use(authenticate);

router.get('/', dashboardStats);

export default router;
