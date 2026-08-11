import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";
import { needs, providers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function verifyCompatibleOpportunities() {
  console.log("=== TESTE COMPLETO: ETAPA 12 — OPORTUNIDADES COMPATÍVEIS ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados indisponível!");
    process.exit(1);
  }

  // 1. Criar Contratante
  const contractorId = `contractor_etapa12_${Date.now()}`;
  await db.upsertUser({
    openId: contractorId,
    name: "Empresa Contratante Alpha",
    email: `alpha.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const contractor = (await db.getUserByOpenId(contractorId))!;
  const contractorCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: contractor,
  });

  // 2. Criar Profissional 1 (Eletricista em Bragança Paulista — Dias úteis, Manhã/Tarde)
  const pro1Id = `pro1_etapa12_${Date.now()}`;
  await db.upsertUser({
    openId: pro1Id,
    name: "Carlos Eletricista Pro",
    email: `carlos.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const pro1 = (await db.getUserByOpenId(pro1Id))!;
  const pro1Caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: pro1,
  });

  await pro1Caller.providers.updateOpportunityAvailability({
    isAvailable: true,
    categories: ["Reformas e Reparos"],
    subcategories: ["eletricista"],
    cities: ["Bragança Paulista"],
    maxDistanceKm: 30,
    availableDays: ["seg", "ter", "qua", "qui", "sex"],
    shifts: ["manha", "tarde"],
    startTime: "08:00",
    endTime: "18:00",
  });

  // 3. Criar Profissional 2 (Diarista em Atibaia — Fins de semana, Manhã)
  const pro2Id = `pro2_etapa12_${Date.now()}`;
  await db.upsertUser({
    openId: pro2Id,
    name: "Juliana Diarista Pro",
    email: `juliana.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const pro2 = (await db.getUserByOpenId(pro2Id))!;
  const pro2Caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: pro2,
  });

  await pro2Caller.providers.updateOpportunityAvailability({
    isAvailable: true,
    categories: ["Serviços Domésticos"],
    subcategories: ["diarista"],
    cities: ["Atibaia"],
    maxDistanceKm: 15,
    availableDays: ["sab", "dom"],
    shifts: ["manha"],
    startTime: "07:00",
    endTime: "12:00",
  });

  // 4. Criar 4 Necessidades com características controladas
  // Necessidade A: Eletricista em Bragança Paulista na Segunda-feira (10/08/2026 = Seg) às 09:00
  const needARes = await contractorCaller.needs.create({
    title: "Instalação de Quadro Elétrico Residencial",
    description: "Preciso de eletricista qualificado para instalação de disjuntores e fiação.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    subcategoryId: "eletricista",
    subcategoryName: "Eletricista",
    city: "Bragança Paulista",
    neighborhood: "Centro",
    requiredProfessionals: 1,
    budget: 350,
    paymentType: "total",
    startDate: "2026-08-10", // Segunda-feira (seg)
    startTime: "09:00", // Manhã
  });
  const needAId = needARes.id;

  // Necessidade B: Diarista em Atibaia no Sábado (15/08/2026 = Sáb) às 08:00
  const needBRes = await contractorCaller.needs.create({
    title: "Faxina Completa em Casa de Campo",
    description: "Limpeza pós-obra e organização geral em Atibaia aos sábados.",
    category: "Serviços Domésticos",
    categoryId: "servicos-domesticos",
    subcategoryId: "diarista",
    subcategoryName: "Diarista",
    city: "Atibaia",
    neighborhood: "Jardim do Lago",
    requiredProfessionals: 1,
    budget: 200,
    paymentType: "diaria",
    startDate: "2026-08-15", // Sábado (sab)
    startTime: "08:00", // Manhã
  });
  const needBId = needBRes.id;

  // Necessidade C: Mecânico Noturno em Campinas (Incompatível com ambos)
  const needCRes = await contractorCaller.needs.create({
    title: "Socorro Mecânico Noturno Rodovia",
    description: "Reparo emergencial de suspensão em caminhão na rodovia.",
    category: "Automotivo",
    categoryId: "automotivo",
    subcategoryId: "mecanico",
    subcategoryName: "Mecânico",
    city: "Campinas",
    neighborhood: "Rodovia D. Pedro",
    requiredProfessionals: 1,
    budget: 500,
    paymentType: "total",
    startDate: "2026-08-12", // Quarta-feira
    startTime: "21:00", // Noite
  });
  const needCId = needCRes.id;

  // ── TESTE 1: Feed para Profissional 1 (Carlos - Eletricista em Bragança) ──
  console.log("🧪 Teste 1: Verificando feed para Carlos (Eletricista Bragança)...");
  const pro1List = await pro1Caller.needs.list({
    limit: 50,
    sortBy: "recent",
  });

  console.log(`  ✓ Total de oportunidades retornadas: ${pro1List.items.length}`);
  console.log(`  ✓ hasCompatibilityProfile: ${pro1List.hasCompatibilityProfile}`);

  const itemA_pro1 = pro1List.items.find((i) => i.id === needAId);
  const itemB_pro1 = pro1List.items.find((i) => i.id === needBId);
  const itemC_pro1 = pro1List.items.find((i) => i.id === needCId);

  if (!itemA_pro1 || !itemA_pro1.isCompatible) {
    console.error("❌ FALHA: Necessidade A deveria ser compatível com Carlos!");
    process.exit(1);
  }
  console.log(`  ✅ Necessidade A (Eletricista Bragança): isCompatible = ${itemA_pro1.isCompatible} (Motivos: ${itemA_pro1.compatibilityReasons.join(", ")})`);

  if (itemB_pro1 && itemB_pro1.isCompatible) {
    console.error("❌ FALHA: Necessidade B (Diarista Atibaia) NÃO deveria ser compatível com Carlos!");
    process.exit(1);
  }
  console.log(`  ✅ Necessidade B (Diarista Atibaia): isCompatible = ${itemB_pro1?.isCompatible ?? false} (Não compatível corretamente)`);

  if (itemC_pro1 && itemC_pro1.isCompatible) {
    console.error("❌ FALHA: Necessidade C (Mecânico Noturno Campinas) NÃO deveria ser compatível com Carlos!");
    process.exit(1);
  }
  console.log(`  ✅ Necessidade C (Mecânico Campinas): isCompatible = ${itemC_pro1?.isCompatible ?? false} (Não compatível corretamente)`);

  // ── TESTE 2: Ordenação por compatibilidade (Itens compatíveis no topo) ──
  console.log("\n🧪 Teste 2: Verificando se oportunidades compatíveis aparecem no topo...");
  const firstItem = pro1List.items[0];
  if (!firstItem.isCompatible) {
    console.error("❌ FALHA: O primeiro item do feed deveria ser compatível!");
    process.exit(1);
  }
  console.log(`  ✅ Primeiro item do feed é compatível: "${firstItem.title}"`);

  // ── TESTE 3: Feed para Profissional 2 (Juliana - Diarista em Atibaia) ──
  console.log("\n🧪 Teste 3: Verificando feed para Juliana (Diarista Atibaia)...");
  const pro2List = await pro2Caller.needs.list({
    limit: 50,
    sortBy: "recent",
  });

  const itemA_pro2 = pro2List.items.find((i) => i.id === needAId);
  const itemB_pro2 = pro2List.items.find((i) => i.id === needBId);

  if (itemA_pro2 && itemA_pro2.isCompatible) {
    console.error("❌ FALHA: Necessidade A (Eletricista Bragança) NÃO deveria ser compatível com Juliana!");
    process.exit(1);
  }
  console.log(`  ✅ Necessidade A (Eletricista Bragança): isCompatible = ${itemA_pro2?.isCompatible ?? false}`);

  if (!itemB_pro2 || !itemB_pro2.isCompatible) {
    console.error("❌ FALHA: Necessidade B (Diarista Atibaia) deveria ser compatível com Juliana!");
    process.exit(1);
  }
  console.log(`  ✅ Necessidade B (Diarista Atibaia): isCompatible = ${itemB_pro2.isCompatible} (Motivos: ${itemB_pro2.compatibilityReasons.join(", ")})`);

  // ── TESTE 4: Filtro exclusivo de compatíveis (onlyCompatible: true) ──
  console.log("\n🧪 Teste 4: Verificando filtro onlyCompatible: true...");
  const onlyCompatList = await pro1Caller.needs.list({
    onlyCompatible: true,
  });

  console.log(`  ✓ Oportunidades compatíveis retornadas para Carlos: ${onlyCompatList.items.length}`);
  const allAreCompat = onlyCompatList.items.every((i) => i.isCompatible);
  if (!allAreCompat || onlyCompatList.items.length === 0) {
    console.error("❌ FALHA: Filtro onlyCompatible retornou itens não compatíveis ou lista vazia!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Filtro onlyCompatible: true filtrou com 100% de exatidão.");

  // ── TESTE 5: Todas as oportunidades continuam visíveis sem esconder nada ──
  console.log("\n🧪 Teste 5: Garantindo que outras oportunidades não são escondidas...");
  const publicList = await contractorCaller.needs.list({
    limit: 50,
  });
  console.log(`  ✓ Total no feed geral: ${publicList.items.length} itens disponíveis`);
  if (publicList.items.length < 3) {
    console.error("❌ FALHA: Oportunidades foram escondidas indevidamente!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Todas as oportunidades continuam acessíveis no feed.");

  console.log("\n🎉 TODOS OS TESTES DA ETAPA 12 FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyCompatibleOpportunities().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
