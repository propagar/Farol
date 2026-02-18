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

const summarizeError = (error) => {
  if (!error) return 'unknown_error';

  const base = [error.code, error.message].filter(Boolean).join(' ');
  return base.slice(0, 160) || 'unknown_error';
};

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
    return buildResponse(400, 'E-mail e senha são obrigatórios');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return buildResponse(400, 'E-mail inválido');
  }

  if (password.length < 6) {
    return buildResponse(400, 'A senha deve ter pelo menos 6 caracteres');
  }

  let pool;
  try {
    pool = getPool();
  } catch (error) {
    console.error('AUTH_REGISTER_ERROR', error?.code, error?.message);
    return buildResponse(503, 'Banco indisponível. Tente novamente em instantes.');
  }

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('AUTH_REGISTER_ERROR', error?.code, error?.message);
    return buildResponse(503, 'Banco indisponível. Tente novamente em instantes.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await pool.query('INSERT INTO users(email, password_hash) VALUES ($1, $2)', [email, passwordHash]);
    return buildResponse(201, 'Conta criada com sucesso', { ok: true });
  } catch (error) {
    console.error('AUTH_REGISTER_ERROR', error?.code, error?.message);

    if (error.code === '23505') {
      return buildResponse(409, 'E-mail já cadastrado. Faça login.');
    }

    if (isDbUnavailable(error)) {
      return buildResponse(503, 'Banco indisponível. Tente novamente em instantes.');
    }

    return buildResponse(500, 'Erro interno ao cadastrar.', { detail: summarizeError(error) });
  }
};
