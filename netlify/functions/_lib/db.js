import pg from 'pg';

const { Pool } = pg;

let pool;

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
