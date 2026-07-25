import { Router } from 'express';
import { listFaculty, getFacultyMember } from '../controllers/faculty.js';

const router = Router();

router.get('/', listFaculty);
router.get('/:name', getFacultyMember);

export default router;
