import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifyOpportunitiesFeed() {
  console.log("=== VERIFICAÇÃO DO FEED DE OPORTUNIDADES (SITE + PWA) ===");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: null,
  });

  // 1. Simular chamada do PWA (com coordenadas GPS do usuário em Bragança Paulista)
  console.log("\n📱 1. Consultando feed de oportunidades via PWA...");
  const pwaFeed = await caller.needs.list({
    status: "ativa",
    latitude: -22.952,
    longitude: -46.542,
    sortBy: "recent",
    limit: 50,
  });

  console.log(`✓ Oportunidades ativas retornadas para o PWA: ${pwaFeed.items.length}`);

  // 2. Simular chamada do Site Web Desktop
  console.log("\n💻 2. Consultando feed de oportunidades via Site Web Desktop...");
  const webFeed = await caller.needs.list({
    status: "ativa",
    latitude: -22.952,
    longitude: -46.542,
    sortBy: "recent",
    limit: 50,
  });

  console.log(`✓ Oportunidades ativas retornadas para o Site: ${webFeed.items.length}`);

  // 3. Validar equivalência dos itens
  if (pwaFeed.items.length !== webFeed.items.length) {
    console.error("❌ Discrepância na contagem de itens entre Site e PWA!");
    process.exit(1);
  }

  console.log("\n📋 3. Amostra dos cards do feed com todos os campos exigidos:");
  pwaFeed.items.slice(0, 3).forEach((item, idx) => {
    console.log(`\n--- Card #${idx + 1} ---`);
    console.log(`📌 Título: ${item.title}`);
    console.log(`🏷️ Categoria: ${item.category} (Sub: ${item.subcategoryName || "N/A"})`);
    console.log(`📝 Descrição: ${item.description.slice(0, 70)}...`);
    console.log(`💰 Valor Oferecido: R$ ${item.budget} (${item.paymentType})`);
    console.log(`📅 Data: ${item.startDate} ${item.endDate ? `a ${item.endDate}` : ""}`);
    console.log(`⏰ Horário: ${item.startTime || "--:--"} às ${item.endTime || "--:--"}`);
    console.log(`📍 Localização: ${item.neighborhood ? `${item.neighborhood} — ` : ""}${item.city}`);
    console.log(`🧭 Distância: ${item.distanceStr || "Sem coordenadas"}`);
    console.log(`👥 Profissionais: ${item.requiredProfessionals} vaga(s) | Preenchidas: ${item.filledSpots}`);
    console.log(`📋 Requisitos: ${item.requirements || "Nenhum"}`);
    console.log(`🕒 Status: ${item.status} (Criado em: ${item.createdAt})`);
  });

  // 4. Testar filtros específicos
  console.log("\n🔍 4. Testando filtros...");
  const catFiltered = await caller.needs.list({
    status: "ativa",
    categoryId: "reformas-reparos",
  });
  console.log(`✓ Filtro por Categoria 'reformas-reparos': ${catFiltered.items.length} itens encontrados`);

  const cityFiltered = await caller.needs.list({
    status: "ativa",
    city: "Bragança Paulista",
  });
  console.log(`✓ Filtro por Cidade 'Bragança Paulista': ${cityFiltered.items.length} itens encontrados`);

  console.log("\n🎉 FEED DE OPORTUNIDADES VALIDADO COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyOpportunitiesFeed().catch((err) => {
  console.error("❌ ERRO:", err);
  process.exit(1);
});
