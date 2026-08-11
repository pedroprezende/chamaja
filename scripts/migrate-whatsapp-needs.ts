import "dotenv/config";
import * as db from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const d = await db.getDb();
  if (!d) throw new Error("Banco de dados não disponível.");

  console.log("Executando migration para adicionar colunas de WhatsApp na tabela needs...");
  await d.execute(sql`ALTER TABLE needs ADD COLUMN IF NOT EXISTS allow_whatsapp_contact boolean NOT NULL DEFAULT true;`);
  await d.execute(sql`ALTER TABLE needs ADD COLUMN IF NOT EXISTS whatsapp_contact varchar(50);`);
  console.log("✅ Colunas allow_whatsapp_contact e whatsapp_contact verificadas/adicionadas com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro na migration:", err);
  process.exit(1);
});
