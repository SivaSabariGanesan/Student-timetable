import { Router } from 'express';
import { listRooms, getRoom } from '../controllers/rooms.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// V2 [Critical]: Require authentication to access room schedules.
router.use(authenticate);

router.get('/', listRooms);
router.get('/:name', getRoom);

export default router;
