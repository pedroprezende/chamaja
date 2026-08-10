import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifyOpportunitiesFilters() {
  console.log("=== TESTE COMPLETO: ETAPA 10 — FILTROS DE OPORTUNIDADES ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados indisponível!");
    process.exit(1);
  }

  // 1. Criar Usuário Contratante
  const ownerOpenId = `owner_etapa10_${Date.now()}`;
  await db.upsertUser({
    openId: ownerOpenId,
    name: "Construtora Horizonte",
    email: `horizonte.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const ownerUser = (await db.getUserByOpenId(ownerOpenId))!;

  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: ownerUser,
  });

  console.log("Criando necessidades de teste com diferentes categorias, subcategorias, cidades, turnos, valores e coordenadas...");

  // Need A: Bragança Paulista (Centro: -22.952, -46.542), Reformas / Eletricista, Manhã (08:00), R$ 600
  const needA = await caller.needs.create({
    title: "Troca de Fiação Elétrica Residencial",
    description: "Substituição completa de fiação e disjuntores no centro de Bragança.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    subcategoryId: "eletricista",
    subcategoryName: "Eletricista",
    requiredProfessionals: 1,
    startDate: "2026-09-15",
    startTime: "08:00",
    endTime: "12:00",
    budget: 600.0,
    paymentType: "diaria",
    city: "Bragança Paulista",
    neighborhood: "Centro",
    latitude: -22.952,
    longitude: -46.542,
  });
  console.log(`  ✓ Need A (Bragança, Eletricista, Manhã, R$600, Lat/Lng): ${needA.id}`);

  // Need B: Atibaia (Centro: -23.118, -46.556, ~18km de Bragança), Reformas / Pintura, Tarde (13:00), R$ 300
  const needB = await caller.needs.create({
    title: "Pintura de Sala e Corredor",
    description: "Pintura com tinta látex acrílica em Atibaia.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    subcategoryId: "pintor",
    subcategoryName: "Pintor",
    requiredProfessionals: 2,
    startDate: "2026-09-20",
    startTime: "13:00",
    endTime: "18:00",
    budget: 300.0,
    paymentType: "total",
    city: "Atibaia",
    neighborhood: "Alvinópolis",
    latitude: -23.118,
    longitude: -46.556,
  });
  console.log(`  ✓ Need B (Atibaia, Pintor, Tarde, R$300, Lat/Lng): ${needB.id}`);

  // Need C: Campinas (Centro: -22.905, -47.060, ~60km de Bragança), Serviços Domésticos / Faxina, Noite (19:00), R$ 150
  const needC = await caller.needs.create({
    title: "Limpeza Pós-Evento Noturna",
    description: "Higienização de salão comercial após evento corporativo em Campinas.",
    category: "Serviços Domésticos",
    categoryId: "servicos-domesticos",
    subcategoryId: "diarista",
    subcategoryName: "Diarista",
    requiredProfessionals: 3,
    startDate: "2026-09-25",
    startTime: "19:00",
    endTime: "23:30",
    budget: 150.0,
    paymentType: "diaria",
    city: "Campinas",
    neighborhood: "Cambuí",
    latitude: -22.905,
    longitude: -47.060,
  });
  console.log(`  ✓ Need C (Campinas, Diarista, Noite, R$150, Lat/Lng): ${needC.id}`);

  // ── TESTE 1: Feed Normal Sem Filtros ──
  console.log("\n🧪 Teste 1: Feed Normal sem filtros...");
  const noFiltersRes = await caller.needs.list({});
  console.log(`  ✓ Total retornado: ${noFiltersRes.items.length} itens.`);
  if (noFiltersRes.items.length < 3) {
    console.error("❌ FALHA: Feed sem filtros deveria retornar todas as oportunidades ativas.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Feed sem filtros funcionando normalmente.");

  // ── TESTE 2: Filtro por Categoria ──
  console.log("\n🧪 Teste 2: Filtro por Categoria ('servicos-domesticos')...");
  const catRes = await caller.needs.list({ categoryId: "servicos-domesticos" });
  console.log(`  ✓ Itens na categoria servicos-domesticos: ${catRes.items.length}`);
  const hasOnlyDomesticos = catRes.items.every(
    (i) => i.categoryId === "servicos-domesticos" || i.category?.includes("Domésticos")
  );
  if (!hasOnlyDomesticos || catRes.items.length === 0) {
    console.error("❌ FALHA: Filtro por categoria falhou.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro por categoria funcionando.");

  // ── TESTE 3: Filtro por Subcategoria ──
  console.log("\n🧪 Teste 3: Filtro por Subcategoria ('eletricista')...");
  const subRes = await caller.needs.list({ subcategoryId: "eletricista" });
  console.log(`  ✓ Itens com subcategoria eletricista: ${subRes.items.length}`);
  const hasNeedA = subRes.items.some((i) => i.id === needA.id);
  const hasNeedB = subRes.items.some((i) => i.id === needB.id);
  if (!hasNeedA || hasNeedB) {
    console.error("❌ FALHA: Filtro por subcategoria deveria retornar Need A e não Need B.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro por subcategoria funcionando.");

  // ── TESTE 4: Filtro por Cidade ──
  console.log("\n🧪 Teste 4: Filtro por Cidade ('Atibaia')...");
  const cityRes = await caller.needs.list({ city: "Atibaia" });
  console.log(`  ✓ Itens em Atibaia: ${cityRes.items.length}`);
  const allAtibaia = cityRes.items.every((i) => i.city.toLowerCase().includes("atibaia"));
  if (!allAtibaia || cityRes.items.length === 0) {
    console.error("❌ FALHA: Filtro por cidade falhou.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro por cidade funcionando.");

  // ── TESTE 5: Filtro por Horário / Turno ──
  console.log("\n🧪 Teste 5: Filtro por Turno ('noite')...");
  const nightRes = await caller.needs.list({ timeFilter: "noite" });
  console.log(`  ✓ Itens no turno da noite: ${nightRes.items.length}`);
  const hasNeedC = nightRes.items.some((i) => i.id === needC.id);
  if (!hasNeedC) {
    console.error("❌ FALHA: Need C deveria constar no turno da noite.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro por turno funcionando.");

  // ── TESTE 6: Filtro por Valor Mínimo ──
  console.log("\n🧪 Teste 6: Filtro por Valor Mínimo (minBudget: 500)...");
  const budgetRes = await caller.needs.list({ minBudget: 500 });
  console.log(`  ✓ Itens com valor >= R$ 500: ${budgetRes.items.length}`);
  const allBudget500 = budgetRes.items.every((i) => Number(i.budget) >= 500);
  if (!allBudget500 || budgetRes.items.length === 0) {
    console.error("❌ FALHA: Filtro de valor mínimo falhou.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro por valor mínimo funcionando.");

  // ── TESTE 7: Filtro por Distância Geográfica Real (GPS) ──
  console.log("\n🧪 Teste 7: Filtro por Raio de Distância (Usuário em Bragança Paulista: -22.952, -46.542, maxDistance: 25 km)...");
  const distRes = await caller.needs.list({
    latitude: -22.952,
    longitude: -46.542,
    maxDistanceKm: 25,
  });
  console.log(`  ✓ Itens em até 25 km de Bragança: ${distRes.items.length}`);
  const hasBraganca = distRes.items.some((i) => i.id === needA.id);
  const hasAtibaia = distRes.items.some((i) => i.id === needB.id);
  const hasCampinas = distRes.items.some((i) => i.id === needC.id); // Campinas fica a ~60km, deve ser excluída

  console.log(`    Need A (Bragança - ~0km): ${hasBraganca ? "✓ Incluída" : "❌ Faltando"}`);
  console.log(`    Need B (Atibaia - ~18km): ${hasAtibaia ? "✓ Incluída" : "❌ Faltando"}`);
  console.log(`    Need C (Campinas - ~60km): ${!hasCampinas ? "✓ Corretamente Excluída" : "❌ Deveria ter sido excluída"}`);

  if (!hasBraganca || !hasAtibaia || hasCampinas) {
    console.error("❌ FALHA: Filtro por raio de distância não filtrou corretamente com base nas coordenadas.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Cálculo de distância Haversine e filtro por raio funcionando perfeitamente.");

  // ── TESTE 8: Filtros Combinados ──
  console.log("\n🧪 Teste 8: Filtros Combinados (Categoria Reformas + Cidade Bragança + minBudget 500)...");
  const comboRes = await caller.needs.list({
    categoryId: "reformas-reparos",
    city: "Bragança Paulista",
    minBudget: 500,
  });
  console.log(`  ✓ Itens combinados: ${comboRes.items.length}`);
  const hasNeedAInCombo = comboRes.items.some((i) => i.id === needA.id);
  const allMatchCombo = comboRes.items.every(
    (i) =>
      (i.categoryId === "reformas-reparos" || i.category?.includes("Reformas")) &&
      i.city.toLowerCase().includes("bragança") &&
      Number(i.budget) >= 500
  );

  if (!hasNeedAInCombo || !allMatchCombo) {
    console.error("❌ FALHA: Filtros combinados retornaram itens inconsistentes.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtros combinados funcionando com precisão e consistência.");

  console.log("\n🎉 TODOS OS TESTES DE FILTROS DE OPORTUNIDADES FORAM APROVADOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyOpportunitiesFilters().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
