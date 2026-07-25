import { Router } from 'express';
import { searchStudents, getStudent, getAllStudents } from '../controllers/students.js';

const router = Router();

router.get('/search', searchStudents);
router.get('/all', getAllStudents);
router.get('/:reg', getStudent);

export default router;
