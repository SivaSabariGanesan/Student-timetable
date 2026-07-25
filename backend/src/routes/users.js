import { Router } from 'express';
import { listUsers, createUser, updateUserRole, deleteUser } from '../controllers/users.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = Router();

// All users routes require login and at minimum the 'admin' role
router.use(authenticate, authorize('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
