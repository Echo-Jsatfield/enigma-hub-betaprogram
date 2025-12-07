import fs from 'fs';
import path from 'path';
import os from 'os';
// On Node 18+ you have global fetch; otherwise: import fetch from 'node-fetch';

const API_BASE = 'https://enigmalogistics.org/api';
const LOGIN_ENDPOINT = '/auth/login';

export async function saveAuthToken(email, password) {
  const resp = await fetch(API_BASE + LOGIN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!resp.ok) throw new Error(`Login failed: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  if (!data.token) throw new Error('No token returned from login');

  return writeAuthToken(data.token, data.user);
}

// Write a provided token to Documents\EnigmaHub\auth_token.txt (no login)
export async function writeAuthToken(token, user = null) {
  if (!token) throw new Error('No token provided');

  const dir = path.join(os.homedir(), 'Documents', 'EnigmaHub');
  const file = path.join(dir, 'auth_token.txt');
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(file, token, 'utf8');
  return { file, user, token };
}
