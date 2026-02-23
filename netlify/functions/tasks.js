import { ensureAppDataSchema, getPool } from './_lib/db.js';
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
  await ensureAppDataSchema();

  if (event.httpMethod === 'GET') {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, description, category_id, due_date, priority, is_habit, checklist, done, completed_at, created_at
       FROM task_data.tasks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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

    const description = typeof data.description === 'string' ? data.description.trim() : null;
    const categoryId = typeof data.categoryId === 'string' ? data.categoryId : null;
    const dueDate = typeof data.dueDate === 'string' && data.dueDate.trim() ? data.dueDate : null;
    const priority = typeof data.priority === 'string' ? data.priority : null;
    const isHabit = Boolean(data.isHabit);
    const checklist = Array.isArray(data.checklist) ? data.checklist : [];

    const { rows } = await pool.query(
      `INSERT INTO task_data.tasks(user_id, title, description, category_id, due_date, priority, is_habit, checklist, done)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, false)
       RETURNING id, user_id, title, description, category_id, due_date, priority, is_habit, checklist, done, completed_at, created_at`,
      [userId, title, description, categoryId, dueDate, priority, isHabit, JSON.stringify(checklist)]
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
      `UPDATE task_data.tasks
       SET done = $1,
           completed_at = CASE WHEN $1 THEN now() ELSE NULL END,
           updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, title, description, category_id, due_date, priority, is_habit, checklist, done, completed_at, created_at`,
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

    const result = await pool.query('DELETE FROM task_data.tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    if (result.rowCount === 0) {
      return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify({ error: 'Task not found' }) };
    }

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
};
