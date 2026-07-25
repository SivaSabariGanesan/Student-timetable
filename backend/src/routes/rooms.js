import { Router } from 'express';
import { listRooms, getRoom } from '../controllers/rooms.js';

const router = Router();

router.get('/', listRooms);
router.get('/:name', getRoom);

export default router;
