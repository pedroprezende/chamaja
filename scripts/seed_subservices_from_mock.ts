import 'dotenv/config';
import { getDb } from '../server/db';
import { subServices, categories as categoriesTable } from '../drizzle/schema';
import { subcategoriesByCategory, categories as mockCategories } from '../data/mock';
import { eq } from 'drizzle-orm';

async function main() {
  console.log("Iniciando sincronização completa do Mock para o Banco...");
  const db = await getDb();
  if (!db) {
    console.error("Erro: Banco de dados não disponível.");
    process.exit(1);
  }

  // 1. Sincronizar Categorias
  console.log("Sincronizando Categorias...");
  for (const mockCat of mockCategories) {
    try {
      const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.id, mockCat.id));
      if (existing.length === 0) {
        await db.insert(categoriesTable).values({
          id: mockCat.id,
          name: mockCat.name.replace('\n', ' '),
          icon: mockCat.icon,
          displayOrder: 0,
          isActive: true
        });
        console.log(`[NOVA] Categoria: ${mockCat.name}`);
      } else {
        await db.update(categoriesTable).set({
          name: mockCat.name.replace('\n', ' '),
          icon: mockCat.icon,
          updatedAt: new Date()
        }).where(eq(categoriesTable.id, mockCat.id));
      }
    } catch (err) {
      console.error(`Erro ao sincronizar categoria ${mockCat.id}:`, err);
    }
  }

  // 2. Sincronizar Especialidades
  console.log("Sincronizando Especialidades...");
  for (const catId of Object.keys(subcategoriesByCategory)) {
    const mockSubs = subcategoriesByCategory[catId];
    for (const mockSub of mockSubs) {
      try {
        const existing = await db.select().from(subServices).where(eq(subServices.id, mockSub.id));
        
        if (existing.length === 0) {
          await db.insert(subServices).values({
            id: mockSub.id,
            categoryId: mockSub.categoryId,
            name: mockSub.name,
            icon: mockSub.icon || "build",
            imageUrl: mockSub.imageUrl || null,
            displayOrder: 0,
            isActive: true
          });
          console.log(`[NOVA] Especialidade: ${mockSub.name}`);
        } else {
          await db.update(subServices).set({
            imageUrl: mockSub.imageUrl || existing[0].imageUrl,
            icon: mockSub.icon || existing[0].icon,
            updatedAt: new Date()
          }).where(eq(subServices.id, mockSub.id));
        }
      } catch (err) {
        console.error(`Erro ao sincronizar especialidade ${mockSub.id}:`, err);
      }
    }
  }

  console.log("Sincronização concluída com sucesso.");
  process.exit(0);
}

main();
