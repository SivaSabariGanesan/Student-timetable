import pg from 'pg';
import env from './env.js';

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Enforce SSL in production — Neon requires it; protects credentials in transit.
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: true } : false,
});

pool.on('error', (err) => {
  // Log pool errors without exposing connection string details.
  console.error('Unexpected DB pool error:', err.message);
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 100) {
    // V10 [Medium]: Never log query text in production — it may contain
    // parameterised values that were interpolated by the caller, or reveal
    // table/column structure useful to an attacker reading server logs.
    if (env.nodeEnv !== 'production') {
      console.debug('Slow query (%dms): %s', duration, text.slice(0, 120));
    } else {
      console.warn('Slow query detected (%dms)', duration);
    }
  }

  return result;
}

export default pool;
