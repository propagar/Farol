import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
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

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return buildResponse(503, 'Login com Google indisponível: GOOGLE_CLIENT_ID não configurado.');
  }

  const data = parseBody(event.body);
  if (!data) {
    return buildResponse(400, 'JSON inválido');
  }

  const idToken = String(data.id_token || '');
  if (!idToken) {
    return buildResponse(400, 'id_token é obrigatório');
  }

  let tokenPayload;
  try {
    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const tokenInfo = await tokenInfoResponse.json();

    if (!tokenInfoResponse.ok) {
      return buildResponse(401, 'id_token inválido');
    }

    if (tokenInfo.aud !== googleClientId) {
      return buildResponse(401, 'Token Google inválido para este app');
    }

    if (tokenInfo.email_verified !== 'true') {
      return buildResponse(401, 'Conta Google sem e-mail verificado');
    }

    tokenPayload = tokenInfo;
  } catch {
    return buildResponse(503, 'Falha ao validar token Google');
  }

  const email = String(tokenPayload.email || '').trim().toLowerCase();
  if (!email) {
    return buildResponse(401, 'Token Google sem e-mail');
  }

  let pool;
  try {
    pool = getPool();
  } catch {
    return buildResponse(503, 'Banco indisponível, tente novamente');
  }

  try {
    let userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (!userResult.rows[0]) {
      const randomPasswordHash = await bcrypt.hash(`google-${randomUUID()}`, 12);
      userResult = await pool.query(
        'INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, randomPasswordHash]
      );
    }

    const user = userResult.rows[0];
    const token = jwt.sign({ user_id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ token })
    };
  } catch (error) {
    if (error.code === '23505') {
      const { rows } = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
      const user = rows[0];
      if (user) {
        const token = jwt.sign({ user_id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ token }) };
      }
    }

    if (isDbUnavailable(error)) {
      return buildResponse(503, 'Banco indisponível, tente novamente');
    }

    return buildResponse(500, 'Erro ao finalizar login com Google');
  }
};
