#!/usr/bin/env node
/**
 * Load environment variables from .env file
 * Usage: node load-env.mjs [path-to-env-file]
 * Default path: .env
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.argv[2] || '.env');

if (!existsSync(envPath)) {
  console.error(`❌ Error: .env file not found at ${envPath}`);
  process.exit(1);
}

const content = readFileSync(envPath, 'utf-8');
const lines = content.split('\n');

let loaded = 0;
let skipped = 0;
let empty = 0;

for (const line of lines) {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    if (trimmed.startsWith('#') && trimmed.includes('=')) {
      skipped++;
    }
    continue;
  }
  
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  
  // Remove surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  if (!value || value === 'your-value-here' || value.includes('xxx')) {
    empty++;
    console.warn(`⚠️  ${key} is empty or has placeholder value`);
  } else {
    process.env[key] = value;
    loaded++;
  }
}

console.log(`\n📋 Summary:`);
console.log(`   Loaded: ${loaded} variables`);
console.log(`   Empty/placeholder: ${empty} variables`);
console.log(`   Commented out: ${skipped} lines`);

if (skipped > 0) {
  console.log(`\n⚠️  WARNING: ${skipped} lines are commented out (start with #).`);
  console.log(`   Edit ${envPath} and remove the # from lines you want to use.`);
}

if (empty > 0) {
  console.log(`\n⚠️  WARNING: ${empty} variables have empty or placeholder values.`);
  console.log(`   Fill in real values in ${envPath} before running.`);
}

if (loaded === 0) {
  console.error(`\n❌ No variables were loaded! Check ${envPath}`);
  process.exit(1);
}

console.log(`\n✅ Environment loaded successfully.`);
