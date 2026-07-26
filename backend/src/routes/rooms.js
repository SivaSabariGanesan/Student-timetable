import { Router } from 'express';
import { listRooms, getRoom, freeRooms } from '../controllers/rooms.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listRooms);
router.get('/free', freeRooms);
router.get('/:name', getRoom);

export default router;
