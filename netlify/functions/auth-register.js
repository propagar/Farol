import bcrypt from 'bcryptjs';
import { getPool } from './_lib/db.js';

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

  const data = parseBody(event.body);
  if (!data) {
    return buildResponse(400, 'JSON inválido');
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!email || !password) {
    return buildResponse(400, 'Email e senha são obrigatórios');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return buildResponse(400, 'E-mail inválido');
  }

  if (password.length < 8) {
    return buildResponse(400, 'A senha deve ter pelo menos 8 caracteres');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let pool;
  try {
    pool = getPool();
  } catch {
    return buildResponse(503, 'Banco indisponível, tente novamente');
  }

  try {
    await pool.query('INSERT INTO users(email, password_hash) VALUES ($1, $2)', [email, passwordHash]);
    return buildResponse(201, 'Conta criada com sucesso', { ok: true });
  } catch (error) {
    if (error.code === '23505') {
      return buildResponse(409, 'E-mail já cadastrado');
    }

    if (isDbUnavailable(error)) {
      return buildResponse(503, 'Banco indisponível, tente novamente');
    }

    return buildResponse(500, 'Erro ao cadastrar usuário');
  }
};
