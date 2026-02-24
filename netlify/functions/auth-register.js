import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
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

  const data = parseBody(event.body);
  if (!data) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const fullName = String(data.fullName || '').trim();
  const whatsapp = String(data.whatsapp || '').trim();

  const addressData = data.address || {};
  const addressCep = String(addressData.cep || '').trim();
  const addressCity = String(addressData.city || '').trim();
  const addressNeighborhood = String(addressData.neighborhood || '').trim();
  const addressStreet = String(addressData.street || '').trim();
  const addressNumber = String(addressData.number || '').trim();
  const addressState = String(addressData.state || '').trim();
  const addressCountry = String(addressData.country || '').trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  if (password.length < 8) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Password must have at least 8 characters' }) };
  }

  if (!fullName || !whatsapp || !addressCep || !addressCity || !addressNeighborhood || !addressStreet || !addressNumber || !addressState || !addressCountry) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Missing required registration fields' }) };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const pool = getPool();

  try {
    await ensureAuthSchema();
    await pool.query(
      `INSERT INTO users(
        id, email, password_hash, full_name, whatsapp,
        address_cep, address_city, address_neighborhood,
        address_street, address_number, address_state, address_country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        randomUUID(),
        email,
        passwordHash,
        fullName,
        whatsapp,
        addressCep,
        addressCity,
        addressNeighborhood,
        addressStreet,
        addressNumber,
        addressState,
        addressCountry,
      ]
    );
    return { statusCode: 201, headers: jsonHeaders, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    if (error.code === '23505') {
      return { statusCode: 409, headers: jsonHeaders, body: JSON.stringify({ error: 'Email already registered' }) };
    }

    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: 'Unable to register user' }) };
  }
};
