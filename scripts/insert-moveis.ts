import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";
import { subServices } from "../drizzle/schema";

// Carregar variáveis de ambiente do .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no arquivo .env!");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

const targetCategoryId = "reformas-reparos";

const subServicesToInsert = [
  {
    name: "Montagem de Móveis",
    imageUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
  },
  {
    name: "Desmontagem de Móveis",
    imageUrl:
      "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500&q=80",
  },
];

async function run() {
  try {
    console.log("Conectando ao banco de dados...");

    // Inserir sub-serviços
    console.log(
      `Inserindo especialidades na categoria "${targetCategoryId}"...`,
    );

    const existingSubs = await db
      .select()
      .from(subServices)
      .where(eq(subServices.categoryId, targetCategoryId));

    for (let i = 0; i < subServicesToInsert.length; i++) {
      const item = subServicesToInsert[i];
      const subId = `${targetCategoryId}-moveis-${i}-${Date.now()}`;

      const alreadyHas = existingSubs.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase(),
      );

      if (!alreadyHas) {
        console.log(`Inserindo sub-serviço: "${item.name}"...`);
        const maxOrder =
          existingSubs.length > 0
            ? Math.max(...existingSubs.map((s) => s.displayOrder))
            : -1;

        await db.insert(subServices).values({
          id: subId,
          categoryId: targetCategoryId,
          name: item.name,
          icon: "build",
          imageUrl: item.imageUrl,
          displayOrder: maxOrder + 1 + i,
          isActive: true,
        });
      } else {
        console.log(`Sub-serviço "${item.name}" já está cadastrado.`);
      }
    }

    console.log(
      "\n🚀 Especialidades de montagem e desmontagem de móveis inseridas com sucesso!",
    );
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

run();
