import "dotenv/config";
import * as db from "../server/db";

async function diagnose() {
  console.log("--- Diagnóstico de Usuários ---");
  const connection = await db.getDb();
  if (!connection) {
    console.log("Erro: Não foi possível conectar ao banco.");
    return;
  }
  
  // @ts-ignore
  const { users } = await import("../drizzle/schema");
  const allUsers = await connection.select().from(users);
  
  console.log(`Encontrados ${allUsers.length} usuários:`);
  allUsers.forEach(u => {
    console.log(`- Nome: ${u.name} | E-mail: ${u.email} | Role: ${u.role} | OpenID: ${u.openId}`);
  });
  console.log("-------------------------------");
  process.exit(0);
}

diagnose();
