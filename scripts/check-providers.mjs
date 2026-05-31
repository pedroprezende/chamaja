import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no arquivo .env!");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function run() {
  try {
    console.log("Conectando ao banco de dados...");
    
    const providers = await sql`
      SELECT id, name, address, latitude, longitude, plan, city, neighborhood
      FROM providers
    `;

    console.log("PRESTADORES:");
    console.log(JSON.stringify(providers, null, 2));
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
