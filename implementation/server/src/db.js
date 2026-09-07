import pg from 'pg';

const { Pool } = pg;

// Connects to the project-local Postgres instance started at
// implementation/db/pgdata (see implementation/README.md to start/stop it).
// Overridable via env vars for CI or a different local setup.
export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5433),
  user: process.env.PGUSER || 'vondigitalis',
  database: process.env.PGDATABASE || 'von_digitalis',
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
