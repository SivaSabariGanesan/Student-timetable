import pg from 'pg';
import env from './env.js';

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.debug('Slow query', { text: text.slice(0, 100), duration, rows: result.rowCount });
  }
  return result;
}

export default pool;
