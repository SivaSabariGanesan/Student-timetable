import { Router } from 'express';
import { dashboardStats } from '../controllers/dashboard.js';

const router = Router();

router.get('/', dashboardStats);

export default router;
