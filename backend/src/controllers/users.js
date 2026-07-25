import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };

// Safe columns to return — never expose password_hash
const SELECT_COLS = 'id, email, name, role, created_at, updated_at';

/**
 * GET /api/users
 * - superuser: sees everyone
 * - admin: sees only admins and users (not other superusers)
 */
export async function listUsers(req, res, next) {
  try {
    let result;
    if (req.user.role === 'superuser') {
      result = await query(
        `SELECT ${SELECT_COLS} FROM users ORDER BY role, name`
      );
    } else {
      // admin sees admin + user only
      result = await query(
        `SELECT ${SELECT_COLS} FROM users WHERE role IN ('admin','user') ORDER BY role, name`
      );
    }
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users
 * - superuser: can create any role
 * - admin: can only create 'user' role
 */
export async function createUser(req, res, next) {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'email, name, password and role are required' });
    }

    if (!ROLE_RANK[role]) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.keys(ROLE_RANK).join(', ')}` });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Admins can only create users, not other admins or superusers
    if (req.user.role === 'admin' && role !== 'user') {
      return res.status(403).json({ error: 'Admins can only create accounts with the "user" role' });
    }

    // Nobody can create a role higher than their own
    if (ROLE_RANK[role] > ROLE_RANK[req.user.role]) {
      return res.status(403).json({ error: 'Cannot create a user with a higher role than your own' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_COLS}`,
      [email.toLowerCase().trim(), hash, name.trim(), role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    next(err);
  }
}

/**
 * PATCH /api/users/:id/role
 * Change a user's role.
 *
 * superuser:
 *   - can promote/demote anyone except other superusers
 *   - cannot change their own role
 *
 * admin:
 *   - can promote 'user' → 'admin'
 *   - cannot demote or touch other admins / superusers
 *   - cannot change their own role
 */
export async function updateUserRole(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { role: newRole } = req.body;

    if (!newRole || !ROLE_RANK[newRole]) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.keys(ROLE_RANK).join(', ')}` });
    }

    if (targetId === req.user.id) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const targetResult = await query(
      `SELECT ${SELECT_COLS} FROM users WHERE id = $1`,
      [targetId]
    );
    const target = targetResult.rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });

    const actorRank = ROLE_RANK[req.user.role];
    const targetCurrentRank = ROLE_RANK[target.role];
    const newRoleRank = ROLE_RANK[newRole];

    // Cannot touch a user of equal or higher rank
    if (targetCurrentRank >= actorRank) {
      return res.status(403).json({ error: 'Cannot modify a user with equal or higher role than your own' });
    }

    // Cannot promote above your own rank
    if (newRoleRank > actorRank) {
      return res.status(403).json({ error: 'Cannot promote a user to a higher role than your own' });
    }

    // Admins can only promote user→admin, not demote
    if (req.user.role === 'admin') {
      if (target.role !== 'user' || newRole !== 'admin') {
        return res.status(403).json({ error: 'Admins can only promote users to admin' });
      }
    }

    const updated = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING ${SELECT_COLS}`,
      [newRole, targetId]
    );

    res.json({ user: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/:id
 * superuser: can delete any non-superuser account
 * admin: cannot delete anyone
 */
export async function deleteUser(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.user.id) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    const targetResult = await query(
      `SELECT ${SELECT_COLS} FROM users WHERE id = $1`,
      [targetId]
    );
    const target = targetResult.rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Only superuser can delete; they cannot delete other superusers
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can delete accounts' });
    }
    if (target.role === 'superuser') {
      return res.status(403).json({ error: 'Cannot delete another superuser account' });
    }

    await query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}
