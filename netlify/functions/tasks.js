import { getPool } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseBody = (body) => {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return null;
  }
};

export const handler = async (event) => {
  const auth = requireUser(event);
  if (auth.error) {
    return auth.error;
  }

  const pool = getPool();
  const { userId } = auth;

  if (event.httpMethod === 'GET') {
    const { rows } = await pool.query(
      'SELECT id, user_id, title, done, created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ tasks: rows }) };
  }

  if (event.httpMethod === 'POST') {
    const data = parseBody(event.body);
    if (!data) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const title = String(data.title || '').trim();
    if (!title) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Title is required' }) };
    }

    const { rows } = await pool.query(
      'INSERT INTO tasks(user_id, title, done) VALUES ($1, $2, false) RETURNING id, user_id, title, done, created_at',
      [userId, title]
    );

    return { statusCode: 201, headers: jsonHeaders, body: JSON.stringify({ task: rows[0] }) };
  }

  if (event.httpMethod === 'PATCH') {
    const data = parseBody(event.body);
    if (!data) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const taskId = String(data.id || '');
    const done = Boolean(data.done);

    if (!taskId) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Task id is required' }) };
    }

    const { rows } = await pool.query(
      'UPDATE tasks SET done = $1 WHERE id = $2 AND user_id = $3 RETURNING id, user_id, title, done, created_at',
      [done, taskId, userId]
    );

    if (!rows[0]) {
      return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Task not found' }) };
    }

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ task: rows[0] }) };
  }

  if (event.httpMethod === 'DELETE') {
    const data = parseBody(event.body);
    const taskId = String(data?.id || '');

    if (!taskId) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Task id is required' }) };
    }

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    if (result.rowCount === 0) {
      return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Task not found' }) };
    }

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
};
