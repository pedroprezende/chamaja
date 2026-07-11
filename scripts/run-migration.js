const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Read DATABASE_URL from .env file
  let DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL="([^"]+)"/);
      if (match) {
        DATABASE_URL = match[1];
      }
    }
  }

  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = postgres(DATABASE_URL, { max: 1 });

  try {
    // Check if columns already exist
    console.log('Checking existing columns...');
    
    const planBenefitsCols = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'plan_benefits' AND column_name = 'key'
    `;
    console.log('plan_benefits.key exists:', planBenefitsCols.length > 0);

    const providersPlanStatus = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'providers' AND column_name = 'plan_status'
    `;
    console.log('providers.plan_status exists:', providersPlanStatus.length > 0);

    const providersPlanStarted = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'providers' AND column_name = 'plan_started_at'
    `;
    console.log('providers.plan_started_at exists:', providersPlanStarted.length > 0);

    const pagamentosPlanId = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'pagamentos' AND column_name = 'plan_id'
    `;
    console.log('pagamentos.plan_id exists:', pagamentosPlanId.length > 0);

    // Add missing columns
    if (planBenefitsCols.length === 0) {
      console.log('Adding key column to plan_benefits...');
      await client`ALTER TABLE plan_benefits ADD COLUMN key VARCHAR(100)`;
    }

    if (providersPlanStatus.length === 0) {
      console.log('Adding plan_status column to providers...');
      await client`ALTER TABLE providers ADD COLUMN plan_status VARCHAR(50) DEFAULT 'gratuito'`;
    }

    if (providersPlanStarted.length === 0) {
      console.log('Adding plan_started_at column to providers...');
      await client`ALTER TABLE providers ADD COLUMN plan_started_at TIMESTAMP`;
    }

    if (pagamentosPlanId.length === 0) {
      console.log('Adding plan_id column to pagamentos...');
      await client`ALTER TABLE pagamentos ADD COLUMN plan_id UUID`;
    }

    // Backfill plan_status
    console.log('Backfilling plan_status...');
    await client`
      UPDATE providers SET plan_status = CASE
        WHEN plan IS NOT NULL AND plan_expires_at > NOW() THEN 'ativo'
        WHEN plan IS NOT NULL AND plan_expires_at <= NOW() THEN 'expirado'
        ELSE 'gratuito'
      END
      WHERE plan_status IS NULL OR plan_status = 'gratuito'
    `;

    // Backfill planStartedAt
    console.log('Backfilling plan_started_at...');
    await client`
      UPDATE providers SET plan_started_at = created_at
      WHERE plan_started_at IS NULL AND plan IS NOT NULL
    `;

    // Migrate benefit names to structured keys
    console.log('Migrating benefit names to keys...');
    await client`UPDATE plan_benefits SET key = 'verified_badge' WHERE LOWER(name) LIKE '%verificad%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'premium_badge' WHERE (LOWER(name) LIKE '%premium%' OR LOWER(name) LIKE '%selo premium%') AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'featured_search' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%busca%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'featured_map' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%mapa%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'homepage_highlight' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%inicial%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'analytics_basic' WHERE LOWER(name) LIKE '%estatistic%' AND LOWER(name) LIKE '%básic%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'analytics_advanced' WHERE LOWER(name) LIKE '%estatistic%' AND LOWER(name) LIKE '%avançad%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'unlimited_photos' WHERE LOWER(name) LIKE '%foto%' AND LOWER(name) LIKE '%ilimitad%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'priority_support' WHERE LOWER(name) LIKE '%suporte%' AND LOWER(name) LIKE '%priorit%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'reports' WHERE LOWER(name) LIKE '%relatório%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'favorites_statistics' WHERE LOWER(name) LIKE '%favorito%' AND key IS NULL`;
    await client`UPDATE plan_benefits SET key = 'real_time_statistics' WHERE LOWER(name) LIKE '%tempo real%' AND key IS NULL`;

    // Generate keys for remaining benefits
    console.log('Generating keys for remaining benefits...');
    await client`UPDATE plan_benefits SET key = LOWER(REPLACE(name, ' ', '_')) WHERE key IS NULL`;

    // Create indexes
    console.log('Creating indexes...');
    try {
      await client`CREATE INDEX IF NOT EXISTS idx_plan_benefits_key ON plan_benefits(key)`;
    } catch (e) { /* ignore */ }
    try {
      await client`CREATE INDEX IF NOT EXISTS idx_plan_benefits_plan_id_key ON plan_benefits(plan_id, key)`;
    } catch (e) { /* ignore */ }
    try {
      await client`CREATE INDEX IF NOT EXISTS idx_providers_plan_status ON providers(plan_status)`;
    } catch (e) { /* ignore */ }
    try {
      await client`CREATE INDEX IF NOT EXISTS idx_providers_plan_id ON providers(plan_id)`;
    } catch (e) { /* ignore */ }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
