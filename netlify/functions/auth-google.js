import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool, verifyDatabaseConnection } from './_lib/db.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseBody = (body) => {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return null;
  }
};

const fetchGoogleTokenInfo = async (credential) => {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const jwtSecret = process.env.JWT_SECRET;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!jwtSecret || !googleClientId) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Google OAuth não está configurado no servidor.' })
    };
  }

  const data = parseBody(event.body);

  if (!data?.credential) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Credential do Google é obrigatória.' }) };
  }

  try {
    const tokenInfo = await fetchGoogleTokenInfo(data.credential);

    if (!tokenInfo || tokenInfo.aud !== googleClientId || tokenInfo.email_verified !== 'true') {
      return { statusCode: 401, headers: jsonHeaders, body: JSON.stringify({ error: 'Falha ao validar autenticação do Google.' }) };
    }

    const email = String(tokenInfo.email || '').trim().toLowerCase();
    if (!email) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Não foi possível obter o e-mail do Google.' }) };
    }

    const pool = getPool();
    let userId;

    const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (existing.rows[0]) {
      userId = existing.rows[0].id;
    } else {
      const temporaryPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      const inserted = await pool.query('INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id', [email, passwordHash]);
      userId = inserted.rows[0].id;
    }

    const token = jwt.sign({ user_id: userId, email }, jwtSecret, { expiresIn: '7d' });

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ token }) };
  } catch (error) {
    if (error.code?.startsWith('08')) {
      try {
        await verifyDatabaseConnection();
      } catch {
        return {
          statusCode: 503,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Não foi possível conectar ao banco de dados. Tente novamente em instantes.' })
        };
      }
    }

    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: 'Não foi possível concluir o login com Google.' }) };
  }
};
