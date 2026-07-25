import { Router } from 'express';
import { getFullStore } from '../controllers/store.js';

const router = Router();

router.get('/', getFullStore);

export default router;
