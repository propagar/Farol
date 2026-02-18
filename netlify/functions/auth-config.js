const jsonHeaders = { 'Content-Type': 'application/json' };

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  const googleClientId = String(process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({
      googleClientId,
      googleEnabled: Boolean(googleClientId),
    }),
  };
};

