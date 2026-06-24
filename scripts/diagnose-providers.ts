import "dotenv/config";
import * as db from "../server/db";

async function diagnose() {
  console.log("--- Diagnóstico de Prestadores ---");
  const connection = await db.getDb();
  if (!connection) {
    console.log("Erro: Não foi possível conectar ao banco.");
    return;
  }

  // @ts-ignore
  const { providers } = await import("../drizzle/schema");
  const allProviders = await connection.select().from(providers);

  console.log(`Encontrados ${allProviders.length} prestadores:`);
  allProviders.forEach((p) => {
    console.log(
      `- Nome: ${p.name} | Endereço: ${p.address} | Lat: ${p.latitude} | Lon: ${p.longitude} | Plano: ${p.plan}`,
    );
  });
  console.log("----------------------------------");
  process.exit(0);
}

diagnose();
