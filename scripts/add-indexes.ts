import 'dotenv/config';
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Iniciando aplicação dos índices de performance...");
  const db = await getDb();
  if (!db) {
    console.error("Erro: Banco de dados não disponível.");
    process.exit(1);
  }

  const indexes = [
    `CREATE INDEX IF NOT EXISTS "services_category_id_idx" ON "services" ("category_id");`,
    `CREATE INDEX IF NOT EXISTS "services_subcategory_id_idx" ON "services" ("subcategory_id");`,
    `CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services" ("is_active");`,
    `CREATE INDEX IF NOT EXISTS "providers_category_id_idx" ON "providers" ("category_id");`,
    `CREATE INDEX IF NOT EXISTS "providers_subcategory_id_idx" ON "providers" ("subcategory_id");`,
    `CREATE INDEX IF NOT EXISTS "providers_is_active_idx" ON "providers" ("is_active");`,
    `CREATE INDEX IF NOT EXISTS "providers_destaque_idx" ON "providers" ("destaque");`,
    `CREATE INDEX IF NOT EXISTS "providers_user_id_idx" ON "providers" ("user_id");`,
    `CREATE INDEX IF NOT EXISTS "providers_latitude_idx" ON "providers" ("latitude");`,
    `CREATE INDEX IF NOT EXISTS "providers_longitude_idx" ON "providers" ("longitude");`,
    `CREATE INDEX IF NOT EXISTS "providers_rating_idx" ON "providers" ("rating");`,
    `CREATE INDEX IF NOT EXISTS "providers_online_status_idx" ON "providers" ("online_status");`,
    `CREATE INDEX IF NOT EXISTS "reviews_professional_id_idx" ON "reviews" ("professional_id");`,
    `CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites" ("user_id");`,
    `CREATE INDEX IF NOT EXISTS "favorites_provider_id_idx" ON "favorites" ("provider_id");`,
    `CREATE INDEX IF NOT EXISTS "app_events_prestador_id_idx" ON "app_events" ("prestador_id");`,
    `CREATE INDEX IF NOT EXISTS "app_events_usuario_id_idx" ON "app_events" ("usuario_id");`
  ];

  for (const query of indexes) {
    try {
      console.log(`Executando: ${query}`);
      await db.execute(sql.raw(query));
    } catch (err: any) {
      console.error(`Erro ao criar índice:`, err.message);
    }
  }

  console.log("Aplicação de índices finalizada!");
  process.exit(0);
}

main();
