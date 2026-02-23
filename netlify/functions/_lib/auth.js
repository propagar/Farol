import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt.js';

const unauthorized = (message = 'Unauthorized') => ({
  statusCode: 401,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message })
});

export const requireUser = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: unauthorized('Missing Bearer token') };
  }

  const token = authHeader.slice('Bearer '.length);
  const jwtSecret = getJwtSecret();

  if (!jwtSecret) {
    throw new Error('JWT secret is required (JWT_SECRET or NETLIFY_DATABASE_URL).');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded?.user_id) {
      return { error: unauthorized('Invalid token payload') };
    }

    return { userId: decoded.user_id, email: decoded.email };
  } catch {
    return { error: unauthorized('Invalid token') };
  }
};
