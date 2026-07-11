-- Migration: Add structured benefit keys to plan_benefits
-- Run this script to update the database schema for the dynamic plan system

-- 1. Add key column to plan_benefits
ALTER TABLE plan_benefits ADD COLUMN IF NOT EXISTS key VARCHAR(100);

-- 2. Add plan_status column to providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'gratuito';

-- 3. Add plan_started_at column to providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP;

-- 4. Add plan_id column to pagamentos
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS plan_id UUID;

-- 5. Backfill plan_status from existing data
UPDATE providers SET plan_status = CASE
  WHEN plan IS NOT NULL AND "planExpiresAt" > NOW() THEN 'ativo'
  WHEN plan IS NOT NULL AND "planExpiresAt" <= NOW() THEN 'expirado'
  ELSE 'gratuito'
END
WHERE plan_status IS NULL OR plan_status = 'gratuito';

-- 6. Backfill planStartedAt
UPDATE providers SET plan_started_at = created_at
WHERE plan_started_at IS NULL AND plan IS NOT NULL;

-- 7. Migrate existing benefit names to structured keys
UPDATE plan_benefits SET key = 'verified_badge' WHERE LOWER(name) LIKE '%verificad%' AND key IS NULL;
UPDATE plan_benefits SET key = 'premium_badge' WHERE (LOWER(name) LIKE '%premium%' OR LOWER(name) LIKE '%selo premium%') AND key IS NULL;
UPDATE plan_benefits SET key = 'featured_search' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%busca%' AND key IS NULL;
UPDATE plan_benefits SET key = 'featured_map' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%mapa%' AND key IS NULL;
UPDATE plan_benefits SET key = 'homepage_highlight' WHERE LOWER(name) LIKE '%destaque%' AND LOWER(name) LIKE '%inicial%' AND key IS NULL;
UPDATE plan_benefits SET key = 'analytics_basic' WHERE LOWER(name) LIKE '%estatistic%' AND LOWER(name) LIKE '%básic%' AND key IS NULL;
UPDATE plan_benefits SET key = 'analytics_advanced' WHERE LOWER(name) LIKE '%estatistic%' AND LOWER(name) LIKE '%avançad%' AND key IS NULL;
UPDATE plan_benefits SET key = 'unlimited_photos' WHERE LOWER(name) LIKE '%foto%' AND LOWER(name) LIKE '%ilimitad%' AND key IS NULL;
UPDATE plan_benefits SET key = 'priority_support' WHERE LOWER(name) LIKE '%suporte%' AND LOWER(name) LIKE '%priorit%' AND key IS NULL;
UPDATE plan_benefits SET key = 'reports' WHERE LOWER(name) LIKE '%relatório%' AND key IS NULL;
UPDATE plan_benefits SET key = 'favorites_statistics' WHERE LOWER(name) LIKE '%favorito%' AND key IS NULL;
UPDATE plan_benefits SET key = 'real_time_statistics' WHERE LOWER(name) LIKE '%tempo real%' AND key IS NULL;

-- 8. For any remaining benefits without a key, generate one from the name
UPDATE plan_benefits SET key = LOWER(REPLACE(name, ' ', '_')) WHERE key IS NULL;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_benefits_key ON plan_benefits(key);
CREATE INDEX IF NOT EXISTS idx_plan_benefits_plan_id_key ON plan_benefits(plan_id, key);
CREATE INDEX IF NOT EXISTS idx_providers_plan_status ON providers(plan_status);
CREATE INDEX IF NOT EXISTS idx_providers_plan_id ON providers(plan_id);

-- Done!
