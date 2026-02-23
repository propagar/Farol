import pg from 'pg';

const { Pool } = pg;

let pool;
let authSchemaPromise;
let appDataSchemaPromise;

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

export const ensureAppDataSchema = async () => {
  const dbPool = getPool();

  if (!appDataSchemaPromise) {
    appDataSchemaPromise = (async () => {
      await dbPool.query('CREATE SCHEMA IF NOT EXISTS task_data');
      await dbPool.query('CREATE SCHEMA IF NOT EXISTS goal_data');
      await dbPool.query('CREATE SCHEMA IF NOT EXISTS finance_data');

      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS task_data.tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          category_id TEXT,
          due_date DATE,
          priority TEXT,
          is_habit BOOLEAN NOT NULL DEFAULT false,
          checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
          done BOOLEAN NOT NULL DEFAULT false,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await dbPool.query('CREATE INDEX IF NOT EXISTS idx_task_data_tasks_user_id ON task_data.tasks(user_id)');

      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS goal_data.goals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          source TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await dbPool.query('CREATE INDEX IF NOT EXISTS idx_goal_data_goals_user_id ON goal_data.goals(user_id)');

      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS finance_data.records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          source TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await dbPool.query('CREATE INDEX IF NOT EXISTS idx_finance_data_records_user_id ON finance_data.records(user_id)');

      await dbPool.query(`
        INSERT INTO task_data.tasks (id, user_id, title, done, created_at, updated_at)
        SELECT id, user_id, title, done, created_at, created_at
        FROM public.tasks
        ON CONFLICT (id) DO NOTHING
      `);
    })().catch((error) => {
      appDataSchemaPromise = undefined;
      throw error;
    });
  }

  return appDataSchemaPromise;
};
