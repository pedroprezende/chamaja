import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no arquivo .env!");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function run() {
  try {
    console.log("Conectando ao banco de dados...");

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
      `CREATE INDEX IF NOT EXISTS "app_events_usuario_id_idx" ON "app_events" ("usuario_id");`,
    ];

    for (const query of indexes) {
      console.log(`Executando: ${query}`);
      await sql.unsafe(query);
    }

    console.log("Todos os índices foram aplicados com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar índices:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
