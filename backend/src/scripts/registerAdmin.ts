/* Register an admin and a user via the running API */
import 'dotenv/config';

const BASE = process.env['API_BASE'] || 'http://localhost:3001/api/auth';

async function register(user: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(user),
  });
  const out = await res.text();
  let json: unknown;
  try { json = JSON.parse(out); } catch { json = { raw: out }; }
  console.log('Register status:', res.status);
  console.log('Register response:', JSON.stringify(json, null, 2));
  return res.ok;
}

async function main() {
  console.log('Registering admin...');
  await register({
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
  });

  console.log('Registering user...');
  await register({
    username: 'user',
    email: 'user@example.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
  });
}

main().catch(err => {
  console.error('Registration script failed:', err);
  process.exit(1);
});