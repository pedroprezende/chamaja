import "dotenv/config";
import { getDb } from "../server/db";
import { subServices } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const IMAGE_MAP: Record<string, string> = {
  marceneiro:
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
  "conserto-celular":
    "https://images.unsplash.com/photo-1512428559083-a4014c209b35?w=400&q=80",
  "tecnico-notebook":
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80",
  "ar-condicionado":
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80",
  diarista:
    "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&q=80",
  baba: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=80",
  cabeleireiro:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
  barbeiro:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
  mecanico:
    "https://images.unsplash.com/photo-1517524008410-d4484e913a2d?w=400&q=80",
  borracheiro:
    "https://images.unsplash.com/photo-1621905252507-b35242f8969d?w=400&q=80",
  eletricista:
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
  encanador:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  pedreiro:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  pintor:
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80",
};

async function main() {
  console.log("Iniciando atualização de imagens das especialidades...");
  const db = await getDb();
  if (!db) {
    console.error("Erro: Banco de dados não disponível.");
    process.exit(1);
  }

  for (const [id, url] of Object.entries(IMAGE_MAP)) {
    try {
      await db
        .update(subServices)
        .set({ imageUrl: url })
        .where(eq(subServices.id, id));
      console.log(`Atualizado: ${id}`);
    } catch (err) {
      console.error(`Erro ao atualizar ${id}:`, err);
    }
  }

  console.log("Atualização concluída.");
  process.exit(0);
}

main();
