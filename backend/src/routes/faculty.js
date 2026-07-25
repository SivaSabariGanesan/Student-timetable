import { Router } from 'express';
import { listFaculty, getFacultyMember } from '../controllers/faculty.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// V2 [Critical]: Require authentication to access faculty schedules.
router.use(authenticate);

router.get('/', listFaculty);
router.get('/:name', getFacultyMember);

export default router;
