import { Router } from 'express';
import { getFullStore, rebuildStore } from '../controllers/store.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = Router();

// V2 [Critical]: The full store payload contains all student PII (names, emails,
// register numbers, full schedules). Authentication is required for GET as well.
router.get('/', authenticate, getFullStore);
router.post('/rebuild', authenticate, authorize('admin'), rebuildStore);

export default router;
