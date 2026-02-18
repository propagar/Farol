const FALLBACK_JWT_SECRET = 'farol-dev-fallback-jwt-secret-change-in-production';

export const getJwtSecret = () => {
  const configured = String(process.env.JWT_SECRET || '').trim();
  if (configured) {
    return configured;
  }

  console.warn('JWT_SECRET ausente; usando fallback de desenvolvimento. Configure JWT_SECRET no ambiente.');
  return FALLBACK_JWT_SECRET;
};

