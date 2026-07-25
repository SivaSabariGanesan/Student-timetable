import { Router } from 'express';
import { getFullStore, rebuildStore } from '../controllers/store.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = Router();

router.get('/', getFullStore);
router.post('/rebuild', authenticate, authorize('admin'), rebuildStore);

export default router;
