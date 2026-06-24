import "dotenv/config";
import * as db from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("--- Executando Migração de Ações Administrativas ---");
  const connection = await db.getDb();
  if (!connection) {
    console.error("Erro: Não foi possível conectar ao banco.");
    process.exit(1);
  }

  try {
    console.log(
      "1. Adicionando coluna 'status' na tabela 'users' se não existir...",
    );
    await connection.execute(
      sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ativo';`,
    );

    console.log(
      "2. Adicionando coluna 'phone' na tabela 'users' se não existir...",
    );
    await connection.execute(
      sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
    );

    console.log("3. Criando tabela 'admin_user_actions' se não existir...");
    await connection.execute(
      sql`
        CREATE TABLE IF NOT EXISTS public.admin_user_actions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          action_type VARCHAR(50) NOT NULL, -- 'suspender', 'bloquear', 'reativar', 'excluir'
          reason TEXT NOT NULL,
          admin_email VARCHAR(320) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `,
    );

    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao rodar migração:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();
