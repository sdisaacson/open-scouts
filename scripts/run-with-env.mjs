#!/usr/bin/env node
/**
 * Run any command with .env variables loaded
 * Usage: bun run with-env -- node scripts/setup-db.mjs
 *        bun run with-env -- bunx supabase functions deploy scout-cron
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { resolve } from 'path';

const envPath = resolve('.env');
const content = readFileSync(envPath, 'utf-8');

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (value && !value.includes('your-') && !value.includes('xxx')) {
    process.env[key] = value;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node run-with-env.mjs <command> [args...]');
  process.exit(1);
}

const [cmd, ...cmdArgs] = args;
const child = spawn(cmd, cmdArgs, {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

child.on('exit', (code) => process.exit(code));
