/* Simple script to verify login endpoint end-to-end */
import 'dotenv/config';

const API_URL = process.env['API_URL'] || 'http://localhost:3001/api/auth/login';

async function main() {
  const body = {
    identifier: 'admin@example.com',
    password: 'Admin123!',
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(json, null, 2));

    if (res.ok) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Login test failed:', err);
    process.exit(1);
  }
}

main();