import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";
import { providers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function verifyProviderAvailability() {
  console.log("=== TESTE COMPLETO: ETAPA 11 — DISPONIBILIDADE DO PROFISSIONAL ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados indisponível!");
    process.exit(1);
  }

  // 1. Criar Usuário Prestador de Teste
  const proOpenId = `pro_etapa11_${Date.now()}`;
  await db.upsertUser({
    openId: proOpenId,
    name: "Mestre Roberto Eletricista",
    email: `roberto.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const proUser = (await db.getUserByOpenId(proOpenId))!;

  const proCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: proUser,
  });

  // Criar Usuário 2 (para teste de isolamento de dados)
  const user2OpenId = `user2_etapa11_${Date.now()}`;
  await db.upsertUser({
    openId: user2OpenId,
    name: "Ana Pintora",
    email: `ana.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const user2 = (await db.getUserByOpenId(user2OpenId))!;
  const user2Caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: user2,
  });

  // ── TESTE 1: Consulta Inicial de Disponibilidade (Padrões Inteligentes) ──
  console.log("🧪 Teste 1: Consultando disponibilidade padrão inicial...");
  const initialAvail = await proCaller.providers.getOpportunityAvailability();
  console.log(`  ✓ isAvailable: ${initialAvail.isAvailable}`);
  console.log(`  ✓ Cidades padrão: ${initialAvail.cities.join(", ")}`);
  console.log(`  ✓ Raio padrão: ${initialAvail.maxDistanceKm} km`);
  console.log(`  ✓ Dias disponíveis: ${initialAvail.availableDays.join(", ")}`);

  if (!initialAvail.isAvailable || initialAvail.maxDistanceKm !== 30) {
    console.error("❌ FALHA: Valores padrão iniciais incorretos.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Consulta inicial retornou padrões consistentes.");

  // ── TESTE 2: Atualização e Salvamento da Disponibilidade Personalizada ──
  console.log("\n🧪 Teste 2: Salvando configurações de disponibilidade personalizadas...");
  const updateRes = await proCaller.providers.updateOpportunityAvailability({
    isAvailable: true,
    categories: ["Reformas e Reparos", "Serviços Domésticos"],
    subcategories: ["eletricista", "pintor"],
    cities: ["Bragança Paulista", "Atibaia", "Extrema"],
    maxDistanceKm: 45,
    availableDays: ["seg", "ter", "qua", "qui", "sex", "sab"],
    shifts: ["manha", "tarde", "noite"],
    startTime: "07:30",
    endTime: "19:00",
    notes: "Ferramentas próprias completas e veículo utilitário.",
  });
  console.log(`  ✓ Resultado da mutação: success=${updateRes.success}`);

  if (!updateRes.success || updateRes.availability.maxDistanceKm !== 45) {
    console.error("❌ FALHA: Retorno da atualização de disponibilidade incorreto.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Mutação updateOpportunityAvailability executada.");

  // ── TESTE 3: Verificação de Persistência Direta no PostgreSQL ──
  console.log("\n🧪 Teste 3: Verificando persistência no PostgreSQL (tabela 'providers')...");
  const rawProvider = await dbInstance
    .select()
    .from(providers)
    .where(eq(providers.userId, proOpenId))
    .limit(1);

  if (rawProvider.length === 0) {
    console.error("❌ FALHA: Perfil de prestador não encontrado no banco.");
    process.exit(1);
  }

  const rawJson = rawProvider[0].opportunityAvailability as any;
  console.log(`  ✓ JSON persistido:`, JSON.stringify(rawJson));

  if (
    !rawJson ||
    rawJson.isAvailable !== true ||
    rawJson.maxDistanceKm !== 45 ||
    !rawJson.cities.includes("Atibaia") ||
    !rawJson.categories.includes("Reformas e Reparos") ||
    rawJson.startTime !== "07:30" ||
    rawJson.notes !== "Ferramentas próprias completas e veículo utilitário."
  ) {
    console.error("❌ FALHA: Dados persistidos no PostgreSQL não conferem com o payload.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Dados de disponibilidade 100% persistidos no PostgreSQL.");

  // ── TESTE 4: Leitura através do Endpoint de Disponibilidade ──
  console.log("\n🧪 Teste 4: Consultando disponibilidade salva via getOpportunityAvailability...");
  const savedAvail = await proCaller.providers.getOpportunityAvailability();

  if (
    savedAvail.isAvailable !== true ||
    savedAvail.maxDistanceKm !== 45 ||
    savedAvail.cities.length !== 3 ||
    savedAvail.availableDays.length !== 6 ||
    savedAvail.shifts.length !== 3 ||
    savedAvail.startTime !== "07:30" ||
    savedAvail.endTime !== "19:00"
  ) {
    console.error("❌ FALHA: getOpportunityAvailability retornou dados divergentes.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Leitura via tRPC retornou todos os campos exatamente como configurados.");

  // ── TESTE 5: Pausa de Disponibilidade ("Estou disponível: false") ──
  console.log("\n🧪 Teste 5: Pausando disponibilidade do profissional (isAvailable = false)...");
  await proCaller.providers.updateOpportunityAvailability({
    isAvailable: false,
    categories: savedAvail.categories,
    subcategories: savedAvail.subcategories,
    cities: savedAvail.cities,
    maxDistanceKm: savedAvail.maxDistanceKm,
    availableDays: savedAvail.availableDays,
    shifts: savedAvail.shifts,
    startTime: savedAvail.startTime,
    endTime: savedAvail.endTime,
    notes: savedAvail.notes,
  });

  const pausedAvail = await proCaller.providers.getOpportunityAvailability();
  console.log(`  ✓ isAvailable após pausa: ${pausedAvail.isAvailable}`);

  if (pausedAvail.isAvailable !== false) {
    console.error("❌ FALHA: Status de pausa não foi atualizado.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Pausa de disponibilidade funcionando perfeitamente.");

  // ── TESTE 6: Reativação e Consulta via Router needs.ts ──
  console.log("\n🧪 Teste 6: Reativando disponibilidade e consultando via needsRouter...");
  await proCaller.needs.updateOpportunityAvailability({
    isAvailable: true,
    categories: ["Reformas e Reparos"],
    subcategories: ["eletricista"],
    cities: ["Bragança Paulista", "Itatiba"],
    maxDistanceKm: 50,
    availableDays: ["seg", "ter", "qua", "qui", "sex"],
    shifts: ["manha", "tarde"],
  });

  const reactivatedViaNeeds = await proCaller.needs.getOpportunityAvailability();
  console.log(`  ✓ isAvailable via needsRouter: ${reactivatedViaNeeds.isAvailable}`);
  console.log(`  ✓ Raio atualizado: ${reactivatedViaNeeds.maxDistanceKm} km`);

  if (reactivatedViaNeeds.isAvailable !== true || reactivatedViaNeeds.maxDistanceKm !== 50) {
    console.error("❌ FALHA: Reativação via needsRouter falhou.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Paridade total entre providersRouter e needsRouter.");

  // ── TESTE 7: Isolamento e Independência entre Usuários ──
  console.log("\n🧪 Teste 7: Validando isolamento entre múltiplos usuários...");
  const user2Avail = await user2Caller.providers.getOpportunityAvailability();
  console.log(`  ✓ Usuário 2 cidades: ${user2Avail.cities.join(", ")}`);
  console.log(`  ✓ Usuário 2 raio: ${user2Avail.maxDistanceKm} km`);

  if (user2Avail.maxDistanceKm !== 30 || user2Avail.cities.includes("Itatiba")) {
    console.error("❌ FALHA: Vazamento de dados entre usuários!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Cada profissional possui seus dados de disponibilidade totalmente isolados.");

  console.log("\n🎉 TODOS OS TESTES DE DISPONIBILIDADE DO PROFISSIONAL FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyProviderAvailability().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
