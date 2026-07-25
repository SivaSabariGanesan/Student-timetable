// Role hierarchy: superuser > admin > user
const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };

/**
 * authorize(...roles) — requires the caller to have at least one of the listed roles.
 * Superuser always passes (highest rank).
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRank = ROLE_RANK[req.user.role] ?? 0;
    const allowed = roles.some((r) => ROLE_RANK[r] !== undefined && userRank >= ROLE_RANK[r]);
    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * authorizeExact(...roles) — requires an exact role match (no hierarchy promotion).
 * Useful when you want to explicitly gate by a single role.
 */
export function authorizeExact(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
