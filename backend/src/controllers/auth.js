import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../config/db.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: payload });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

export function me(req, res) {
  res.json({ user: req.user });
}
