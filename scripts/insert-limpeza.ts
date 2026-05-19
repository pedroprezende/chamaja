import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";
import { categories, subServices } from "../drizzle/schema";

// Carregar variáveis de ambiente do .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no arquivo .env!");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

const targetCategory = {
  id: "limpeza-especializada",
  name: "Limpeza Especializada",
  icon: "cleaning-services",
  displayOrder: 14,
  isActive: true,
};

const subServicesToInsert = [
  {
    name: "Higienização de Sofá",
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&q=80",
  },
  {
    name: "Higienização de Colchão",
    imageUrl: "https://images.unsplash.com/photo-1632829871576-47b2c01950f3?w=500&q=80",
  },
  {
    name: "Limpeza Pós-Obra",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
  },
  {
    name: "Limpeza de Vidros",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&q=80",
  },
  {
    name: "Lavagem de Tapetes",
    imageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&q=80",
  },
  {
    name: "Impermeabilização",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80",
  },
  {
    name: "Limpeza Comercial",
    imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=80",
  },
  {
    name: "Limpeza de Estofados",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80",
  },
  {
    name: "Sanitização",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=80",
  },
];

async function run() {
  try {
    console.log("Conectando ao banco de dados...");
    
    // 1. Verificar se a categoria principal já existe
    const existingCat = await db
      .select()
      .from(categories)
      .where(eq(categories.id, targetCategory.id))
      .limit(1);

    if (existingCat.length === 0) {
      console.log(`Inserindo categoria principal: "${targetCategory.name}"...`);
      await db.insert(categories).values(targetCategory);
      console.log("Categoria principal inserida com sucesso!");
    } else {
      console.log(`Categoria principal "${targetCategory.name}" já existe no banco.`);
    }

    // 2. Inserir especialidades / sub-serviços
    console.log("Inserindo especialidades/sub-serviços...");
    for (let i = 0; i < subServicesToInsert.length; i++) {
      const item = subServicesToInsert[i];
      const subId = `${targetCategory.id}-${i}-${Date.now()}`;
      
      // Evitar duplicidade pelo nome na mesma categoria
      const existingSub = await db
        .select()
        .from(subServices)
        .where(
          eq(subServices.categoryId, targetCategory.id)
        );
        
      const alreadyHas = existingSub.some(
        (s) => s.name.toLowerCase() === item.name.toLowerCase()
      );

      if (!alreadyHas) {
        console.log(`Inserindo sub-serviço: "${item.name}"...`);
        await db.insert(subServices).values({
          id: subId,
          categoryId: targetCategory.id,
          name: item.name,
          icon: "cleaning-services",
          imageUrl: item.imageUrl,
          displayOrder: i,
          isActive: true,
        });
      } else {
        console.log(`Sub-serviço "${item.name}" já está cadastrado.`);
      }
    }

    console.log("\n🚀 Todas as categorias e especialidades foram inseridas com sucesso no banco de dados!");
  } catch (error) {
    console.error("Erro durante a execução do script de semente:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

run();
