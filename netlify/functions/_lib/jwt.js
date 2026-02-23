import { createHash } from 'node:crypto';

export const getJwtSecret = () => {
  const explicitSecret = process.env.JWT_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  const databaseUrl = process.env.NETLIFY_DATABASE_URL?.trim();
  if (!databaseUrl) {
    return null;
  }

  return createHash('sha256').update(`farol-jwt:${databaseUrl}`).digest('hex');
};

