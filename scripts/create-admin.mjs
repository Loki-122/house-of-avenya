#!/usr/bin/env node
/**
 * Bootstrap the first House of Avenya admin account.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password>
 *
 * The script uses the Supabase service role key (from
 * .env.local or the environment) to:
 *   1. Create the Supabase Auth user (email confirmed)
 *   2. Create or promote their profiles row to
 *      role = 'admin'
 *
 * Server-side only. Never bundle this into the app, and
 * never commit the credentials it uses.
 *
 * Prerequisite: apply
 * supabase/migrations/20261006000000_admin_roles.sql
 * first — the profiles table must have the role column.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------------------- */
/* Environment (process env first, then .env.local as fallback)  */
/* -------------------------------------------------------------- */

function loadEnv() {
  const env = { ...process.env };
  try {
    const local = readFileSync(join(__dirname, '../.env.local'), 'utf8');
    for (const line of local.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || key in env) continue;
      env[key] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env.local is optional if the vars are already exported.
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in .env.local (see .env.example) or export them.',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

function authHeaders() {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: authHeaders(),
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Some responses have no JSON body.
  }
  return { ok: response.ok, status: response.status, body };
}

/* -------------------------------------------------------------- */
/* 1. Create (or find) the auth user                             */
/* -------------------------------------------------------------- */

let userId = null;

const created = await request('/auth/v1/admin/users', {
  method: 'POST',
  body: JSON.stringify({ email, password, email_confirm: true }),
});

if (created.ok) {
  userId = created.body.id;
  console.log(`Created auth user: ${email} (${userId})`);
} else if (created.status === 409) {
  // User already exists — look them up so they can be
  // promoted to admin without changing their password.
  console.log('User already exists, looking up…');
  const lookup = await request(
    `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
  );
  const found = (lookup.body?.users ?? []).find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found) {
    console.error(
      `Supabase reports the user exists but it could not be found: ${JSON.stringify(created.body)}`,
    );
    process.exit(1);
  }
  userId = found.id;
  console.log(`Found existing auth user: ${email} (${userId})`);
} else {
  console.error(
    `Could not create auth user (${created.status}): ${JSON.stringify(created.body)}`,
  );
  process.exit(1);
}

/* -------------------------------------------------------------- */
/* 2. Promote the profile to admin                               */
/* -------------------------------------------------------------- */

const promoted = await request(`/rest/v1/profiles?id=eq.${userId}`, {
  method: 'PATCH',
  body: JSON.stringify({ role: 'admin' }),
});

if (!promoted.ok) {
  if (promoted.body?.code === '42703' || promoted.body?.message?.includes('role')) {
    console.error(
      'The profiles table has no role column.\n' +
        'Apply supabase/migrations/20261006000000_admin_roles.sql in the Supabase SQL Editor first.',
    );
    process.exit(1);
  }
  console.error(
    `Could not update profile (${promoted.status}): ${JSON.stringify(promoted.body)}`,
  );
  process.exit(1);
}

if (promoted.body === 0 || promoted.body?.length === 0) {
  // No profile row exists (the new-user trigger has not
  // run for this account) — create one directly with the
  // service role key.
  const inserted = await request('/rest/v1/profiles', {
    method: 'POST',
    body: JSON.stringify({ id: userId, email, role: 'admin' }),
  });
  if (!inserted.ok) {
    console.error(
      `Could not create profile (${inserted.status}): ${JSON.stringify(inserted.body)}`,
    );
    process.exit(1);
  }
}

console.log('');
console.log(`Admin ready: ${email}`);
console.log('Role: admin');
console.log('');
console.log('Next steps:');
console.log('  1. Open /admin/login and sign in with these credentials.');
console.log('  2. Keep this password somewhere safe — it is shown nowhere else.');
