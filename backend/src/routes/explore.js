import { Router } from 'express';
import { explore } from '../controllers/explore.js';

const router = Router();

router.get('/', explore);

export default router;
