/* Simple script to verify login endpoint end-to-end */
import 'dotenv/config';

const API_BASE = process.env['API_BASE'] || 'http://localhost:5000/api/auth';

async function login(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  console.log(`Login (${identifier}) status:`, res.status);
  console.log('Response:', JSON.stringify(json, null, 2));
  return res.ok;
}

async function main() {
  console.log('Testing admin login...');
  await login('admin@example.com', 'Admin123!');

  console.log('Testing user login...');
  await login('user@example.com', 'User123!');
}

main().catch(err => {
  console.error('Login test failed:', err);
  process.exit(1);
});
// removed duplicate script block