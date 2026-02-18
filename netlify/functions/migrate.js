import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './_lib/db.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const isAuthorized = (event) => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const adminKey = process.env.MIGRATE_ADMIN_KEY;
  const incomingKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  return Boolean(adminKey) && adminKey === incomingKey;
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isAuthorized(event)) {
    return { statusCode: 403, headers: jsonHeaders, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const migrationsDir = path.resolve(currentDir, '../../db/migrations');

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.version));
    const newlyApplied = [];

    for (const fileName of files) {
      if (applied.has(fileName)) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, fileName), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [fileName]);
      newlyApplied.push(fileName);
    }

    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true, applied: newlyApplied, totalMigrations: files.length })
    };
  } catch (error) {
    await client.query('ROLLBACK');
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Migration failed', detail: error.message })
    };
  } finally {
    client.release();
  }
};
