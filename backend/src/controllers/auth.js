import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../config/db.js';

// Shared cookie options — single source of truth so set/clear always match.
// V4 [High]: clearCookie() only removes the cookie if the options (path, domain,
// secure, sameSite) match what was used when setting it. Mismatched flags leave
// the old token cookie in the browser, effectively making logout a no-op.
function cookieOptions() {
  return {
    httpOnly: true,                              // not readable by JS — blocks XSS token theft
    secure: env.nodeEnv === 'production',        // HTTPS-only in production
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 days in ms
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Only fetch the columns we actually need — never SELECT *
    const result = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    // Constant-time comparison via bcrypt even when user doesn't exist,
    // preventing user-enumeration via timing side-channel.
    const dummyHash = '$2b$12$invalidhashfortimingnormalization000000000000000000000';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    res.cookie('token', token, cookieOptions());
    res.json({ user: payload });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  // V4 [High]: Pass identical options (minus maxAge) so the browser actually
  // removes the cookie. Express's clearCookie sets maxAge=0 internally.
  const opts = cookieOptions();
  delete opts.maxAge;
  res.clearCookie('token', opts);
  res.json({ message: 'Logged out' });
}

export async function me(req, res, next) {
  // V4 [High]: Re-fetch the user record from the database on every /me call.
  // The JWT payload is signed and can't be tampered with, but it is a snapshot
  // in time — if an admin demotes or deletes a user, the old token would still
  // return the stale (elevated) role without this DB re-fetch.
  try {
    const result = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      // Account deleted — treat as logged out
      const opts = cookieOptions();
      delete opts.maxAge;
      res.clearCookie('token', opts);
      return res.status(401).json({ error: 'Account not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
