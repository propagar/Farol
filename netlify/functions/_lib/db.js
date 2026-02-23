import pg from 'pg';

const { Pool } = pg;

let pool;
let authSchemaPromise;

export const getPool = () => {
  if (!pool) {
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('NETLIFY_DATABASE_URL (or DATABASE_URL) is not configured.');
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }

  return pool;
};

export const ensureAuthSchema = async () => {
  const dbPool = getPool();

  if (!authSchemaPromise) {
    authSchemaPromise = (async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await dbPool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    })().catch((error) => {
      authSchemaPromise = undefined;
      throw error;
    });
  }

  return authSchemaPromise;
};
