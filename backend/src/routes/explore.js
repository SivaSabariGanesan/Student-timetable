import { Router } from 'express';
import { explore } from '../controllers/explore.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// V2 [Critical]: Require authentication to use the explore/filter endpoint.
router.use(authenticate);

router.get('/', explore);

export default router;
