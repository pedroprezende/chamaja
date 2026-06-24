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

    // Consulta direta usando o driver postgres
    const logs = await sql`
      SELECT id, level, message, details, created_at as "createdAt"
      FROM system_logs
      ORDER BY created_at DESC
      LIMIT 15
    `;

    console.log("ÚLTIMOS 15 LOGS DO SISTEMA:");
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
