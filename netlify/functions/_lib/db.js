import pg from 'pg';

const { Pool } = pg;

let pool;
let schemaBootstrapPromise;

const ensureCoreSchema = async (activePool) => {
  await activePool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await activePool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await activePool.query('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
};

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

export const ensureDatabaseReady = async () => {
  const activePool = getPool();

  if (!schemaBootstrapPromise) {
    schemaBootstrapPromise = ensureCoreSchema(activePool).catch((error) => {
      schemaBootstrapPromise = undefined;
      throw error;
    });
  }

  await schemaBootstrapPromise;
  return activePool;
};
