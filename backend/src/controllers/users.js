import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };
const VALID_ROLES = Object.keys(ROLE_RANK);

// Safe columns — password_hash is never returned.
const SELECT_COLS = 'id, email, name, role, created_at, updated_at';

// V6 [High]: Input validation helpers.
// A minimal but sufficient email regex — full RFC 5322 is overkill here;
// the goal is to reject obviously malformed input before it hits the DB.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (typeof email !== 'string') return 'Email must be a string';
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (trimmed.length > 254) return 'Email is too long';
  if (!EMAIL_RE.test(trimmed)) return 'Email is not valid';
  return null;
}

function validateName(name) {
  if (typeof name !== 'string') return 'Name must be a string';
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 100) return 'Name must be 100 characters or fewer';
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string') return 'Password must be a string';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be 128 characters or fewer';
  return null;
}

function validateRole(role) {
  if (!role || !VALID_ROLES.includes(role)) {
    return `Role must be one of: ${VALID_ROLES.join(', ')}`;
  }
  return null;
}

function parseId(raw) {
  // V6 [High]: parseInt can silently produce NaN for non-numeric strings.
  // We treat any non-positive-integer as invalid.
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * GET /api/users
 * superuser — all users
 * admin     — admins + users only (no superusers)
 */
export async function listUsers(req, res, next) {
  try {
    let result;
    if (req.user.role === 'superuser') {
      result = await query(`SELECT ${SELECT_COLS} FROM users ORDER BY role, name`);
    } else {
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
 * superuser — can create admin or user
 * admin     — can only create user
 */
export async function createUser(req, res, next) {
  try {
    const { email, name, password, role } = req.body;

    // Validate every field before touching the DB.
    const emailErr    = validateEmail(email);
    const nameErr     = validateName(name);
    const passwordErr = validatePassword(password);
    const roleErr     = validateRole(role);

    const errors = [emailErr, nameErr, passwordErr, roleErr].filter(Boolean);
    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }

    // Role-based creation restrictions.
    if (req.user.role === 'admin' && role !== 'user') {
      return res.status(403).json({ error: 'Admins can only create accounts with the "user" role' });
    }
    if (ROLE_RANK[role] > ROLE_RANK[req.user.role]) {
      return res.status(403).json({ error: 'Cannot create a user with a higher role than your own' });
    }

    const safeRole = (role || '').trim().toLowerCase();
    if (!VALID_ROLES.includes(safeRole)) {
      console.error('[createUser] Invalid role value:', { role, safeRole, rawType: typeof role, chars: [...String(role)].map(c => c.charCodeAt(0)) });
      return res.status(400).json({ error: `Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_COLS}`,
      [email.toLowerCase().trim(), hash, name.trim(), safeRole]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    if (err.code === '23514') {
      console.error('[createUser] CHECK constraint violation. Role sent:', JSON.stringify({ role: req.body.role }));
      return res.status(400).json({ error: `Invalid role value. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    next(err);
  }
}

/**
 * PATCH /api/users/:id/role
 */
export async function updateUserRole(req, res, next) {
  try {
    // V6 [High]: Reject NaN or non-integer IDs before the DB query.
    const targetId = parseId(req.params.id);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { role: newRole } = req.body;
    const roleErr = validateRole(newRole);
    if (roleErr) return res.status(400).json({ error: roleErr });

    if (targetId === req.user.id) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const targetResult = await query(
      `SELECT ${SELECT_COLS} FROM users WHERE id = $1`,
      [targetId]
    );
    const target = targetResult.rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });

    const actorRank        = ROLE_RANK[req.user.role];
    const targetCurrentRank = ROLE_RANK[target.role];
    const newRoleRank      = ROLE_RANK[newRole];

    if (targetCurrentRank >= actorRank) {
      return res.status(403).json({ error: 'Cannot modify a user with equal or higher role than your own' });
    }
    if (newRoleRank > actorRank) {
      return res.status(403).json({ error: 'Cannot promote a user to a higher role than your own' });
    }
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
 * Only superusers can delete; they cannot delete other superusers.
 */
export async function deleteUser(req, res, next) {
  try {
    const targetId = parseId(req.params.id);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (targetId === req.user.id) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    const targetResult = await query(
      `SELECT ${SELECT_COLS} FROM users WHERE id = $1`,
      [targetId]
    );
    const target = targetResult.rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });

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
