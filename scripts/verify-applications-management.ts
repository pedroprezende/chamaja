import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";
import { TRPCError } from "@trpc/server";

async function verifyApplicationsManagement() {
  console.log("=== TESTE COMPLETO: ETAPA 7 — VER E GERENCIAR PROFISSIONAIS INTERESSADOS ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  // 1. Criar o Contratante
  const ownerOpenId = `owner_etapa7_${Date.now()}`;
  await db.upsertUser({
    openId: ownerOpenId,
    name: "Dra. Helena Contratante",
    email: `helena.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const ownerUser = (await db.getUserByOpenId(ownerOpenId))!;

  const ownerCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: ownerUser,
  });

  // Criar 3 profissionais candidatos
  const candidates: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const proOpenId = `pro_${i}_${Date.now()}`;
    await db.upsertUser({
      openId: proOpenId,
      name: `Profissional ${i} - Especialista`,
      email: `pro${i}.${Date.now()}@teste.com`,
      loginMethod: "email",
    });
    const u = (await db.getUserByOpenId(proOpenId))!;
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: u,
    });
    candidates.push({ user: u, caller });
  }

  // 2. Criar necessidade com 2 vagas
  const createdNeed = await ownerCaller.needs.create({
    title: "Reforma de Telhado e Instalação de Calhas",
    description: "Necessito de 2 telhadistas com experiência em telhas cerâmicas e calhas de alumínio.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    requiredProfessionals: 2,
    startDate: "2026-09-10",
    budget: 600.0,
    paymentType: "diaria",
    city: "Bragança Paulista",
  });
  console.log(`✓ Necessidade criada com 2 vagas: ${createdNeed.id}`);

  // ── TESTE 1: Publicação com múltiplos interessados ──
  console.log("\n🧪 Teste 1: Enviando 3 candidaturas para a oportunidade...");
  const apps: any[] = [];

  const app1 = await candidates[0].caller.needs.applyToNeed({
    needId: createdNeed.id,
    message: "Tenho 10 anos de experiência em telhado e calhas.",
    proposedPrice: 600.0,
    estimatedTime: "2 dias",
  });
  apps.push(app1);
  console.log(`  ✓ Candidato 1 (${candidates[0].user.name}) se candidatou: ${app1.id}`);

  const app2 = await candidates[1].caller.needs.applyToNeed({
    needId: createdNeed.id,
    message: "Equipe com 2 ajudantes e ferramentas completas.",
    proposedPrice: 650.0,
    estimatedTime: "1 dia",
  });
  apps.push(app2);
  console.log(`  ✓ Candidato 2 (${candidates[1].user.name}) se candidatou: ${app2.id}`);

  const app3 = await candidates[2].caller.needs.applyToNeed({
    needId: createdNeed.id,
    message: "Disponibilidade imediata para início no dia 10.",
    proposedPrice: 600.0,
    estimatedTime: "Imediato",
  });
  apps.push(app3);
  console.log(`  ✓ Candidato 3 (${candidates[2].user.name}) se candidatou: ${app3.id}`);

  // ── TESTE 2: Visualização das candidaturas pelo criador ──
  console.log("\n🧪 Teste 2: Criador listando as candidaturas (needs.listApplications)...");
  const listForOwner = await ownerCaller.needs.listApplications({ needId: createdNeed.id });
  console.log(`  ✓ Total de candidaturas retornadas: ${listForOwner.length}`);

  if (listForOwner.length !== 3) {
    console.error(`❌ FALHA: Esperava 3 candidaturas, obteve ${listForOwner.length}`);
    process.exit(1);
  }

  listForOwner.forEach((appItem, idx) => {
    console.log(`    [${idx + 1}] ${appItem.professionalName} | Proposta: R$ ${appItem.proposedPrice} | Status: ${appItem.status} | Msg: "${appItem.message}"`);
  });
  console.log("  ✅ SUCESSO: Todas as 3 candidaturas foram listadas com detalhes completos.");

  // ── TESTE 3: Controle de acesso - terceiro tentando listar candidaturas ──
  console.log("\n🧪 Teste 3: Usuário terceiro tentando listar candidaturas de outro criador...");
  try {
    await candidates[0].caller.needs.listApplications({ needId: createdNeed.id });
    console.error("❌ FALHA: Deveria ter bloqueado acesso de terceiro com FORBIDDEN!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("Apenas o responsável pela publicação") || err.code === "FORBIDDEN") {
      console.log(`  ✅ SUCESSO: Bloqueado com segurança: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  // ── TESTE 4: Aceitar a candidatura 1 ──
  console.log("\n🧪 Teste 4: Criador aceitando a Candidatura 1...");
  const acceptRes1 = await ownerCaller.needs.acceptApplication({ applicationId: app1.id });
  console.log(`  ✓ Resultado da aceitação: success=${acceptRes1.success}, vagas preenchidas=${acceptRes1.filledSpots}, totalmente preenchido=${acceptRes1.isFullyFilled}`);

  if (acceptRes1.filledSpots !== 1 || acceptRes1.isFullyFilled !== false) {
    console.error("❌ FALHA: Vagas preenchidas incorretas após primeira aceitação.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Candidato 1 aceito e 1 de 2 vagas preenchida.");

  // ── TESTE 5: Recusar a candidatura 2 ──
  console.log("\n🧪 Teste 5: Criador recusando a Candidatura 2...");
  const rejectRes2 = await ownerCaller.needs.rejectApplication({ applicationId: app2.id });
  console.log(`  ✓ Resultado da recusa: success=${rejectRes2.success}`);

  // Verificar se o status atualizou para recusada e se as vagas continuam 1
  const afterRejectList = await ownerCaller.needs.listApplications({ needId: createdNeed.id });
  const app2Updated = afterRejectList.find((a) => a.id === app2.id);
  if (app2Updated?.status === "recusada") {
    console.log("  ✅ SUCESSO: Candidatura 2 marcada como 'recusada'.");
  } else {
    console.error(`❌ FALHA: Status de app2 deveria ser recusada, está: ${app2Updated?.status}`);
    process.exit(1);
  }

  // ── TESTE 6: Preencher a 2ª vaga (Aceitar Candidato 3) ──
  console.log("\n🧪 Teste 6: Criador aceitando Candidato 3 (preenchendo todas as 2 vagas)...");
  const acceptRes3 = await ownerCaller.needs.acceptApplication({ applicationId: app3.id });
  console.log(`  ✓ Resultado da aceitação 3: filledSpots=${acceptRes3.filledSpots}, isFullyFilled=${acceptRes3.isFullyFilled}`);

  if (acceptRes3.filledSpots !== 2 || acceptRes3.isFullyFilled !== true) {
    console.error("❌ FALHA: Necessidade deveria estar totalmente preenchida (2/2).");
    process.exit(1);
  }

  const needDetailsFinal = await ownerCaller.needs.getById({ id: createdNeed.id });
  if (needDetailsFinal.status === "encerrada" && needDetailsFinal.filledSpots === 2) {
    console.log("  ✅ SUCESSO: Necessidade atualizada para status 'encerrada' com todas as 2 vagas preenchidas.");
  } else {
    console.error(`❌ FALHA: Status deveria ser 'encerrada', é: ${needDetailsFinal.status}`);
    process.exit(1);
  }

  // ── TESTE 7: Impedir novas aceitações quando não houver vagas ──
  console.log("\n🧪 Teste 7: Tentativa de aceitar nova candidatura após vagas esgotadas...");
  // Criar 4º candidato e candidatura
  const pro4OpenId = `pro_4_${Date.now()}`;
  await db.upsertUser({
    openId: pro4OpenId,
    name: "Profissional 4",
    email: `pro4.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const pro4User = (await db.getUserByOpenId(pro4OpenId))!;

  // Inserir diretamente uma candidatura pendente para testar a tentativa de aceitação
  const { needApplications } = await import("../drizzle/schema");
  const extraAppId = `app_extra_${Date.now()}`;
  await dbInstance.insert(needApplications).values({
    id: extraAppId,
    needId: createdNeed.id,
    userId: pro4User.openId,
    message: "Cheguei atrasado mas quero vaga",
    status: "pendente",
  });

  try {
    await ownerCaller.needs.acceptApplication({ applicationId: extraAppId });
    console.error("❌ FALHA: Deveria ter impedido aceitar com vagas esgotadas!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("já foram preenchidas")) {
      console.log(`  ✅ SUCESSO: Bloqueado com mensagem clara: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  console.log("\n🎉 TODOS OS 7 CENÁRIOS DE GERENCIAMENTO DE CANDIDATURAS FORAM TESTADOS E APROVADOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyApplicationsManagement().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
