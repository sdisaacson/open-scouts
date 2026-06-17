#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync, spawnSync } from 'child_process';
import pg from 'pg';

const { Client } = pg;

// Load .env file
config();

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('🚀 Running database setup...\n');

    // Run the consolidated schema migration
    const migrationPath = 'supabase/migrations/00000000000000_schema.sql';
    const sql = readFileSync(join(process.cwd(), migrationPath), 'utf8');
    console.log('📄 Running schema migration...');
    await client.query(sql);
    console.log('✅ Schema created!\n');

    // Enable realtime
    console.log('🔄 Enabling realtime for execution tables...');
    try {
      await client.query(`
        ALTER PUBLICATION supabase_realtime ADD TABLE scout_executions;
        ALTER PUBLICATION supabase_realtime ADD TABLE scout_execution_steps;
      `);
      console.log('✅ Realtime enabled!\n');
    } catch (realtimeError) {
      if (realtimeError.message.includes('already member')) {
        console.log('✅ Realtime already enabled!\n');
      } else {
        throw realtimeError;
      }
    }

    // Check if pg_cron, pg_net, and vector extensions are enabled
    console.log('🔍 Checking for required extensions...');
    const { rows: extensions } = await client.query(`
      SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net', 'vector', 'supabase_vault');
    `);

    const hasPgCron = extensions.some(e => e.extname === 'pg_cron');
    const hasPgNet = extensions.some(e => e.extname === 'pg_net');
    const hasVector = extensions.some(e => e.extname === 'vector');
    const hasVault = extensions.some(e => e.extname === 'supabase_vault');

    if (!hasVector) {
      console.log('⚠️  pgvector extension not enabled\n');
      console.log('📝 To enable vector embeddings:');
      console.log('   1. Go to Supabase Dashboard → Database → Extensions');
      console.log('   2. Enable the "vector" extension');
      console.log('   3. Run this script again: npm run setup:db\n');
    } else {
      console.log('✅ pgvector extension enabled!');
    }

    if (hasPgCron && hasPgNet) {
      console.log('✅ Scheduling extensions (pg_cron, pg_net) enabled!');
    } else {
      console.log('⚠️  Scheduling extensions not enabled yet\n');
      console.log('📝 To enable automatic scheduling:');
      console.log('   1. Go to Supabase Dashboard → Database → Extensions');
      const missing = [];
      if (!hasPgCron) missing.push('pg_cron');
      if (!hasPgNet) missing.push('pg_net');
      console.log(`   2. Enable: ${missing.join(', ')}`);
      console.log('   3. Run this script again: npm run setup:db\n');
    }

    if (hasVault) {
      console.log('✅ Vault extension enabled!');
    } else {
      console.log('⚠️  Vault extension not enabled (will try to enable)\n');
    }

    console.log('');

    // Set up the scalable dispatcher architecture if extensions are available
    if (hasPgCron && hasPgNet) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        console.log('⚠️  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        console.log('   Skipping dispatcher setup. Add these to .env and run again.\n');
      } else {
        console.log('🔧 Setting up scalable scout dispatcher...\n');

        // Enable vault if not already enabled
        if (!hasVault) {
          try {
            await client.query('CREATE EXTENSION IF NOT EXISTS supabase_vault;');
            console.log('✅ Enabled supabase_vault extension');
          } catch (vaultError) {
            console.log('⚠️  Could not enable vault:', vaultError.message);
            console.log('   Enable it manually in Dashboard → Database → Extensions\n');
          }
        }

        // Store secrets in vault (upsert pattern)
        console.log('🔐 Configuring vault secrets...');
        try {
          // Delete existing secrets if they exist, then create new ones
          await client.query(`
            DELETE FROM vault.secrets WHERE name IN ('project_url', 'service_role_key');
          `);

          await client.query(`
            SELECT vault.create_secret($1, 'project_url');
          `, [supabaseUrl]);

          await client.query(`
            SELECT vault.create_secret($1, 'service_role_key');
          `, [serviceRoleKey]);

          console.log('✅ Vault secrets configured!\n');
        } catch (secretError) {
          console.log('⚠️  Could not configure vault secrets:', secretError.message);
          console.log('   You may need to run this manually in SQL Editor:\n');
          console.log(`   SELECT vault.create_secret('${supabaseUrl}', 'project_url');`);
          console.log(`   SELECT vault.create_secret('your-service-role-key', 'service_role_key');\n`);
        }

        console.log('⏰ Configuring cron jobs...');

        // Verify the dispatcher jobs exist, create them if missing
        let { rows: cronJobs } = await client.query(`
          SELECT jobname, schedule FROM cron.job WHERE jobname IN ('dispatch-scouts', 'cleanup-scouts');
        `);

        // If jobs are missing, try to create them directly
        if (cronJobs.length < 2) {
          console.log('   Creating dispatcher cron jobs...');

          const hasDispatch = cronJobs.some(j => j.jobname === 'dispatch-scouts');
          const hasCleanup = cronJobs.some(j => j.jobname === 'cleanup-scouts');

          if (!hasDispatch) {
            try {
              await client.query(`
                SELECT cron.schedule(
                  'dispatch-scouts',
                  '* * * * *',
                  'SELECT dispatch_due_scouts()'
                );
              `);
              console.log('   Created: dispatch-scouts (every minute)');
            } catch (e) {
              console.log('   Could not create dispatch-scouts:', e.message);
            }
          }

          if (!hasCleanup) {
            try {
              await client.query(`
                SELECT cron.schedule(
                  'cleanup-scouts',
                  '*/5 * * * *',
                  'SELECT cleanup_scout_executions()'
                );
              `);
              console.log('   Created: cleanup-scouts (every 5 minutes)');
            } catch (e) {
              console.log('   Could not create cleanup-scouts:', e.message);
            }
          }

          // Re-check
          const result = await client.query(`
            SELECT jobname, schedule FROM cron.job WHERE jobname IN ('dispatch-scouts', 'cleanup-scouts');
          `);
          cronJobs = result.rows;
        }

        if (cronJobs.length >= 2) {
          console.log('✅ Dispatcher cron jobs configured:');
          cronJobs.forEach(job => {
            console.log(`   - ${job.jobname}: ${job.schedule}`);
          });
          console.log('');
        } else {
          console.log('⚠️  Dispatcher cron jobs may not be fully configured.');
          console.log('   Try running this SQL in the Supabase SQL Editor:\n');
          console.log(`   SELECT cron.schedule('dispatch-scouts', '* * * * *', 'SELECT dispatch_due_scouts()');`);
          console.log(`   SELECT cron.schedule('cleanup-scouts', '*/5 * * * *', 'SELECT cleanup_scout_executions()');\n`);
        }

        console.log('🎯 Scalable Architecture Enabled!');
        console.log('   Each scout now runs in its own isolated edge function.');
        console.log('   This supports thousands of scouts without timeout issues.\n');
      }
    }

    console.log('🎉 Database setup complete!\n');

    // Authentication setup instructions
    console.log('🔐 Authentication Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 To enable Google OAuth:');
    console.log('   1. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.log('   2. Create OAuth 2.0 credentials');
    console.log('   3. Set authorized redirect URI to:');
    console.log('      https://<your-project-ref>.supabase.co/auth/v1/callback');
    console.log('   4. In Supabase Dashboard → Authentication → Providers → Google');
    console.log('   5. Enable Google and add your Client ID and Secret\n');
    console.log('📝 To enable Email/Password auth:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Providers → Email');
    console.log('   2. Enable Email provider (enabled by default)');
    console.log('   3. Configure email templates as needed\n');

    // Firecrawl setup instructions
    console.log('🔥 Firecrawl Integration Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('This project uses a single shared Firecrawl API key for all users.\n');
    console.log('📝 Setup');
    console.log('   1. Sign up at https://www.firecrawl.dev/');
    console.log('   2. Get your API key from https://www.firecrawl.dev/app/api-keys');
    console.log('   3. Add to .env: FIRECRAWL_API_KEY=fc-your-key-here');
    console.log('   4. Add to edge function secrets:');
    console.log('      npx supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here\n');

    // Sync Edge Function Secrets
    console.log('🔑 Edge Function Secrets');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await syncEdgeFunctionSecrets();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Syncs environment variables from .env to Supabase Edge Function secrets
 */
async function syncEdgeFunctionSecrets() {
  // Define which secrets to sync (env var name -> secret name)
  const secretsToSync = [
    { env: 'OPENAI_API_KEY', name: 'OPENAI_API_KEY', required: true },
    { env: 'FIRECRAWL_API_KEY', name: 'FIRECRAWL_API_KEY', required: true },
    { env: 'RESEND_API_KEY', name: 'RESEND_API_KEY', required: false },
    { env: 'RESEND_FROM_EMAIL', name: 'RESEND_FROM_EMAIL', required: false },
  ];

  const secretsToSet = [];
  const missingRequired = [];
  const missingOptional = [];

  // Check which secrets are available
  for (const secret of secretsToSync) {
    const value = process.env[secret.env];
    if (value) {
      secretsToSet.push({ name: secret.name, value });
    } else if (secret.required) {
      missingRequired.push(secret.env);
    } else {
      missingOptional.push(secret.env);
    }
  }

  // Report missing secrets
  if (missingRequired.length > 0) {
    console.log('⚠️  Missing required secrets in .env:');
    missingRequired.forEach(name => console.log(`   - ${name}`));
    console.log('   Add these to your .env file and run setup again.\n');
  }

  if (missingOptional.length > 0) {
    console.log('ℹ️  Optional secrets not configured:');
    missingOptional.forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  // Sync available secrets
  if (secretsToSet.length > 0) {
    console.log('📤 Syncing secrets to Supabase Edge Functions...\n');

    // Check if Supabase CLI is available and linked
    try {
      execSync('npx supabase --version', { stdio: 'pipe' });
    } catch {
      console.log('⚠️  Supabase CLI not available. Please run manually:');
      secretsToSet.forEach(({ name }) => {
        console.log(`   npx supabase secrets set ${name}=<value>`);
      });
      console.log('');
      return;
    }

    // Try to sync each secret
    let successCount = 0;
    let failedSecrets = [];

    for (const { name, value } of secretsToSet) {
      try {
        // Use spawnSync to avoid shell escaping issues with special characters in API keys
        const result = spawnSync(
          'npx',
          ['supabase', 'secrets', 'set', `${name}=${value}`],
          {
            cwd: process.cwd(),
            encoding: 'utf-8',
            env: process.env,
          }
        );

        if (result.status !== 0) {
          throw new Error(result.stderr || result.stdout || 'Unknown error');
        }
        console.log(`   ✅ ${name}`);
        successCount++;
      } catch (error) {
        const errorOutput = error.message || String(error);

        // Check if it's a "not linked" error
        if (errorOutput.includes('not linked')) {
          console.log('⚠️  Supabase project not linked. Run this first:');
          console.log('   npx supabase link --project-ref <your-project-ref>\n');
          console.log('   Then run setup:db again to sync secrets.\n');
          return;
        }
        failedSecrets.push({ name, error: errorOutput });
        console.log(`   ❌ ${name} - failed to set`);
        // Print error details for debugging
        console.log(`      Error: ${errorOutput.split('\n')[0]}`);
      }
    }

    console.log('');

    if (successCount > 0) {
      console.log(`✅ Synced ${successCount} secret(s) to Supabase Edge Functions!\n`);
    }

    if (failedSecrets.length > 0) {
      console.log('⚠️  Some secrets failed to sync. Set them manually:');
      failedSecrets.forEach(({ name }) => {
        console.log(`   npx supabase secrets set ${name}=<value>`);
      });
      console.log('');
    }
  } else {
    console.log('⚠️  No secrets found in .env to sync.');
    console.log('   Add your API keys to .env and run setup again.\n');
  }
}

runMigrations().catch(console.error);
