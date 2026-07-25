import { Router } from 'express';
import { searchStudents, getStudent, getAllStudents } from '../controllers/students.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// V2 [Critical]: All timetable data routes require authentication.
// Without this, any unauthenticated caller can enumerate all students,
// extract register numbers, names, emails and full course schedules.
router.use(authenticate);

router.get('/search', searchStudents);
router.get('/all', getAllStudents);
router.get('/:reg', getStudent);

export default router;
