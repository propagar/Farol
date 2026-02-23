import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({
        error: 'Configuração ausente no servidor: defina JWT_SECRET para habilitar o login',
        code: 'JWT_SECRET_MISSING'
      })
    };
  }

  const data = parseBody(event.body);
  if (!data) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  const pool = getPool();

  try {
    await ensureAuthSchema();
    const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return { statusCode: 401, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return { statusCode: 401, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const token = jwt.sign({ user_id: user.id, email: user.email }, jwtSecret, {
      expiresIn: '7d'
    });

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ token }) };
  } catch {
    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: 'Unable to login' }) };
  }
};
