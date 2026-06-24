require("dotenv").config();
const postgres = require("postgres");

async function runMigration() {
  console.log("--- Executando Migração de Coluna Status em Providers ---");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log(
      "1. Adicionando coluna 'status' na tabela 'providers' se não existir...",
    );
    await sql`ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ativo';`;
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao rodar migração:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
