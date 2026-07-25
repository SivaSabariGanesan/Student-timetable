import 'dotenv/config';

// V1 [Critical]: JWT_SECRET must be explicitly set in production.
// A hardcoded fallback would let any attacker who knows the default forge valid tokens.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'dev-secret-change-in-production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set or is using the insecure default. Refusing to start.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is not set. Using insecure development default — never do this in production.');
  }
}

export default {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: jwtSecret || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
