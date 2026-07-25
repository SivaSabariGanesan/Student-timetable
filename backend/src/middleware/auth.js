import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, env.jwtSecret);
    } catch {
      // ignore invalid tokens for optional auth
    }
  }
  next();
}
