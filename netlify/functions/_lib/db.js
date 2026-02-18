import pg from 'pg';

const { Pool } = pg;

let pool;

const getConnectionString = () => process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

export const getPool = () => {
  if (!pool) {
    const connectionString = getConnectionString();

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

export const verifyDatabaseConnection = async () => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('NETLIFY_DATABASE_URL (or DATABASE_URL) is not configured.');
  }

  const probePool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await probePool.query('SELECT 1');
    return true;
  } finally {
    await probePool.end();
  }
};
