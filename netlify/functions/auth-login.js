import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './_lib/db.js';
import { getJwtSecret } from './_lib/jwt.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseBody = (body) => {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return null;
  }
};

const buildResponse = (statusCode, message, extra = {}) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify({ message, error: message, ...extra })
});

const isDbUnavailable = (error) => {
  const dbErrorCodes = new Set(['57P01', '57P02', '57P03']);
  return (
    !error?.code ||
    String(error.code).startsWith('08') ||
    dbErrorCodes.has(error.code) ||
    ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error?.errno)
  );
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return buildResponse(405, 'Método não permitido');
  }

  const jwtSecret = getJwtSecret();

  const data = parseBody(event.body);
  if (!data) {
    return buildResponse(400, 'JSON inválido');
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!email || !password) {
    return buildResponse(400, 'Email e senha são obrigatórios');
  }

  let pool;
  try {
    pool = getPool();
  } catch {
    return buildResponse(503, 'Falha de conexão com o banco');
  }

  try {
    const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return buildResponse(401, 'Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return buildResponse(401, 'Credenciais inválidas');
    }

    const token = jwt.sign({ user_id: user.id, email: user.email }, jwtSecret, {
      expiresIn: '7d'
    });

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ token })
    };
  } catch (error) {
    if (isDbUnavailable(error)) {
      return buildResponse(503, 'Falha de conexão com o banco');
    }

    return buildResponse(500, 'Erro ao realizar login');
  }
};
