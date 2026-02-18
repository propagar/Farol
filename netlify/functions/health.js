import { getPool } from './_lib/db.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

export const handler = async () => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return buildResponse(200, { ok: true, message: 'DB OK' });
  } catch (error) {
    console.error('HEALTH_DB_ERROR', error?.code, error?.message);
    return buildResponse(503, {
      ok: false,
      message: 'Banco indisponível. Tente novamente em instantes.'
    });
  }
};
