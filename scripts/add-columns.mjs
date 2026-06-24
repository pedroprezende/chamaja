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

    const statements = [
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS price_level integer DEFAULT 2 NOT NULL;`,
      `CREATE INDEX IF NOT EXISTS "providers_price_level_idx" ON "providers" ("price_level");`,
      `UPDATE providers SET price_level = FLOOR(RANDOM() * 4) + 1;`,
    ];

    for (const stmt of statements) {
      console.log(`Executando: ${stmt}`);
      await sql.unsafe(stmt);
    }

    console.log("Colunas adicionadas com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar colunas:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
