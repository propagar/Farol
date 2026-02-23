import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { ensureAuthSchema, getPool } from './_lib/db.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseBody = (body) => {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return null;
  }
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const data = parseBody(event.body);
  if (!data) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  if (password.length < 8) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Password must have at least 8 characters' }) };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const pool = getPool();

  try {
    await ensureAuthSchema();
    await pool.query('INSERT INTO users(id, email, password_hash) VALUES ($1, $2, $3)', [randomUUID(), email, passwordHash]);
    return { statusCode: 201, headers: jsonHeaders, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    if (error.code === '23505') {
      return { statusCode: 409, headers: jsonHeaders, body: JSON.stringify({ error: 'Email already registered' }) };
    }

    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: 'Unable to register user' }) };
  }
};
