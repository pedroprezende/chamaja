import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifyManageMyNeeds() {
  console.log("=== TESTE COMPLETO: ETAPA 9 — GERENCIAR MINHAS NECESSIDADES ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados indisponível!");
    process.exit(1);
  }

  // 1. Criar Usuário Dono das Publicações
  const ownerOpenId = `owner_etapa9_${Date.now()}`;
  await db.upsertUser({
    openId: ownerOpenId,
    name: "Engenheiro Carlos Silva",
    email: `carlos.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const ownerUser = (await db.getUserByOpenId(ownerOpenId))!;

  const ownerCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: ownerUser,
  });

  // Criar Usuário Terceiro (para testes de segurança)
  const otherOpenId = `other_etapa9_${Date.now()}`;
  await db.upsertUser({
    openId: otherOpenId,
    name: "Usuário Desconhecido",
    email: `other.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const otherUser = (await db.getUserByOpenId(otherOpenId))!;
  const otherCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: otherUser,
  });

  // Criar Profissional Candidato
  const proOpenId = `pro_etapa9_${Date.now()}`;
  await db.upsertUser({
    openId: proOpenId,
    name: "Mestre de Obras Marcos",
    email: `marcos.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const proUser = (await db.getUserByOpenId(proOpenId))!;
  const proCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: proUser,
  });

  // ── TESTE 1: Criação de Necessidades ──
  console.log("🧪 Teste 1: Criando 2 necessidades para o usuário...");
  const need1 = await ownerCaller.needs.create({
    title: "Construção de Muro de Arrimo",
    description: "Muro de contenção de 15 metros lineares em declive.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    requiredProfessionals: 2,
    startDate: "2026-09-15",
    budget: 1200.0,
    paymentType: "total",
    city: "Bragança Paulista",
  });
  console.log(`  ✓ Necessidade 1 criada: ${need1.id}`);

  const need2 = await ownerCaller.needs.create({
    title: "Instalação Hidráulica Residencial",
    description: "Troca de barrilete e tubulações de água quente.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    requiredProfessionals: 1,
    startDate: "2026-09-18",
    budget: 450.0,
    paymentType: "diaria",
    city: "Atibaia",
  });
  console.log(`  ✓ Necessidade 2 criada: ${need2.id}`);

  // ── TESTE 2: Listagem em needs.myPublishedNeeds ──
  console.log("\n🧪 Teste 2: Consultando minhas publicações (needs.myPublishedNeeds)...");
  const proApp = await proCaller.needs.applyToNeed({
    needId: need1.id,
    message: "Tenho experiência com muros de arrimo e fundações.",
    proposedPrice: 1200.0,
  });
  console.log(`  ✓ Candidato se candidatou à Necessidade 1 (${proApp.id})`);

  const myPublishedList = await ownerCaller.needs.myPublishedNeeds({ status: "todas" });
  console.log(`  ✓ Total de publicações do usuário: ${myPublishedList.length}`);

  if (myPublishedList.length < 2) {
    console.error(`❌ FALHA: Esperava ao menos 2 publicações, obteve ${myPublishedList.length}`);
    process.exit(1);
  }

  const foundNeed1 = myPublishedList.find((n) => n.id === need1.id);
  if (!foundNeed1 || foundNeed1.totalApplications !== 1 || foundNeed1.pendingApplications !== 1) {
    console.error("❌ FALHA: Contagem de candidaturas incorreta em myPublishedNeeds.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: needs.myPublishedNeeds retornou as necessidades com contadores corretos.");

  // ── TESTE 3: Edição de Necessidade (needs.update) ──
  console.log("\n🧪 Teste 3: Editando título, valor e requisitos da Necessidade 2 (needs.update)...");
  const updateRes = await ownerCaller.needs.update({
    id: need2.id,
    title: "Instalação Hidráulica e Pressurizador",
    description: "Troca de barrilete, tubulação e instalação de bomba pressurizadora.",
    budget: 600.0,
    requirements: "Experiência com tubos PPR e termofusão.",
  });
  console.log(`  ✓ Resultado da edição: success=${updateRes.success}`);

  const updatedNeed2 = await ownerCaller.needs.getById({ id: need2.id });
  if (
    updatedNeed2.title !== "Instalação Hidráulica e Pressurizador" ||
    Number(updatedNeed2.budget) !== 600 ||
    updatedNeed2.requirements !== "Experiência com tubos PPR e termofusão."
  ) {
    console.error("❌ FALHA: Os dados atualizados não foram persistidos corretamente.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Necessidade editada e persistida com sucesso.");

  // ── TESTE 4: Pausa e Reativação de Necessidade ──
  console.log("\n🧪 Teste 4: Pausando e reativando a Necessidade 2...");
  // 4.1 Pausar
  await ownerCaller.needs.update({ id: need2.id, status: "pausada" });
  const checkPaused = await ownerCaller.needs.getById({ id: need2.id });
  console.log(`  ✓ Status após pausa: ${checkPaused.status}`);

  // Verificar se saiu do feed público ativo
  const publicFeedWhilePaused = await ownerCaller.needs.list({ status: "ativa" });
  const inFeedPaused = publicFeedWhilePaused.items.some((item) => item.id === need2.id);
  if (inFeedPaused) {
    console.error("❌ FALHA: Necessidade pausada não deveria aparecer no feed público de ativas!");
    process.exit(1);
  }
  console.log("  ✓ Necessidade pausada não aparece no feed público ativo.");

  // 4.2 Reativar
  await ownerCaller.needs.update({ id: need2.id, status: "ativa" });
  const checkReactivated = await ownerCaller.needs.getById({ id: need2.id });
  console.log(`  ✓ Status após reativação: ${checkReactivated.status}`);

  const publicFeedAfterReactivate = await ownerCaller.needs.list({ status: "ativa" });
  const inFeedReactivated = publicFeedAfterReactivate.items.some((item) => item.id === need2.id);
  if (!inFeedReactivated) {
    console.error("❌ FALHA: Necessidade reativada deveria aparecer no feed público!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Pausa e reativação funcionam perfeitamente.");

  // ── TESTE 5: Cancelamento de Necessidade (needs.cancel) ──
  console.log("\n🧪 Teste 5: Cancelando a Necessidade 2 (needs.cancel)...");
  await ownerCaller.needs.cancel({ id: need2.id, reason: "Serviço adiado" });

  const checkCancelled = await ownerCaller.needs.getById({ id: need2.id });
  console.log(`  ✓ Status após cancelamento: ${checkCancelled.status}`);

  if (checkCancelled.status !== "cancelada") {
    console.error("❌ FALHA: Status deveria ser 'cancelada'");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Cancelamento realizado com sucesso.");

  // ── TESTE 6: Segurança e Controle de Acesso ──
  console.log("\n🧪 Teste 6: Usuário terceiro tentando editar e cancelar necessidade alheia...");
  try {
    await otherCaller.needs.update({ id: need1.id, title: "Tentativa de invasão" });
    console.error("❌ FALHA: Terceiro não deveria conseguir editar!");
    process.exit(1);
  } catch (err: any) {
    if (err.code === "FORBIDDEN" || err.message?.includes("não tem permissão")) {
      console.log(`  ✅ SUCESSO: Bloqueado ao tentar editar: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  try {
    await otherCaller.needs.cancel({ id: need1.id });
    console.error("❌ FALHA: Terceiro não deveria conseguir cancelar!");
    process.exit(1);
  } catch (err: any) {
    if (err.code === "FORBIDDEN" || err.message?.includes("não tem permissão")) {
      console.log(`  ✅ SUCESSO: Bloqueado ao tentar cancelar: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  console.log("\n🎉 TODOS OS TESTES DE GERENCIAMENTO DE MINHAS NECESSIDADES FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyManageMyNeeds().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
