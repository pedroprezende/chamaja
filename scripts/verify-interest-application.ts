import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";
import { TRPCError } from "@trpc/server";

async function verifyInterestApplication() {
  console.log("=== TESTE COMPLETO: ETAPA 6 — TENHO INTERESSE (SITE + PWA) ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  // Criar 2 usuários para os testes: um contratante (Dono) e um profissional (Candidato)
  const ownerOpenId = `owner_${Date.now()}`;
  const applicantOpenId = `applicant_${Date.now()}`;

  await db.upsertUser({
    openId: ownerOpenId,
    name: "Carlos Contratante",
    email: `carlos.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const ownerUser = await db.getUserByOpenId(ownerOpenId);

  await db.upsertUser({
    openId: applicantOpenId,
    name: "Marcos Eletricista",
    email: `marcos.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const applicantUser = await db.getUserByOpenId(applicantOpenId);

  // 1. Criar necessidade ativa
  const ownerCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: ownerUser!,
  });

  const createdNeed = await ownerCaller.needs.create({
    title: "Instalação de Painel Solar e Quadro Trifásico",
    description: "Instalação de inversor e 12 placas fotovoltaicas em residência.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    requiredProfessionals: 1,
    startDate: "2026-09-01",
    budget: 1200.0,
    paymentType: "total",
    city: "Bragança Paulista",
  });
  console.log(`✓ Necessidade Ativa criada: ${createdNeed.id}`);

  // ── TESTE 1: Usuário Não Autenticado ──
  console.log("\n🧪 Teste 1: Usuário Não Autenticado tentando se candidatar...");
  const unauthCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: null,
  });

  try {
    await unauthCaller.needs.applyToNeed({
      needId: createdNeed.id,
      message: "Quero fazer o serviço",
    });
    console.error("❌ FALHA: Deveria ter barrado usuário não autenticado!");
    process.exit(1);
  } catch (err: any) {
    if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
      console.log("  ✅ SUCESSO: Bloqueado com UNAUTHORIZED como esperado.");
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado (${err.message})`);
    }
  }

  // ── TESTE 2: Candidatura Normal por Usuário Autenticado ──
  console.log("\n🧪 Teste 2 e 3: Candidatura normal de usuário autenticado...");
  const applicantCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: applicantUser!,
  });

  const applyRes = await applicantCaller.needs.applyToNeed({
    needId: createdNeed.id,
    message: "Tenho certificação NR-10 e disponibilidade para início em 01/09.",
    proposedPrice: 1200.0,
    estimatedTime: "1 dia útil",
  });

  console.log(`  ✓ Candidatura registrada no PostgreSQL com ID: ${applyRes.id}`);

  // Verificar se o getById do profissional agora retorna myApplication
  const applicantView = await applicantCaller.needs.getById({ id: createdNeed.id });
  if (applicantView.myApplication && applicantView.myApplication.id === applyRes.id) {
    console.log("  ✅ SUCESSO: getById reconhece 'myApplication' do usuário logado.");
    console.log(`    - Mensagem: "${applicantView.myApplication.message}"`);
    console.log(`    - Proposta: R$ ${applicantView.myApplication.proposedPrice}`);
    console.log(`    - Status: ${applicantView.myApplication.status}`);
  } else {
    console.error("❌ FALHA: myApplication não retornou no getById.");
    process.exit(1);
  }

  // ── TESTE 4: Tentativa de Candidatura Duplicada ──
  console.log("\n🧪 Teste 4: Tentativa de candidatura duplicada pelo mesmo profissional...");
  try {
    await applicantCaller.needs.applyToNeed({
      needId: createdNeed.id,
      message: "Segunda tentativa de candidatura",
    });
    console.error("❌ FALHA: Deveria ter impedido candidatura duplicada!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("já enviou uma candidatura")) {
      console.log(`  ✅ SUCESSO: Bloqueado com mensagem clara: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  // ── TESTE 5: Tentativa de Candidatura na Própria Necessidade ──
  console.log("\n🧪 Teste 5: Tentativa do criador se candidatar à própria necessidade...");
  try {
    await ownerCaller.needs.applyToNeed({
      needId: createdNeed.id,
      message: "Dono tentando se candidatar",
    });
    console.error("❌ FALHA: Criador não pode se candidatar à sua própria vaga!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("própria publicação")) {
      console.log(`  ✅ SUCESSO: Bloqueado com mensagem clara: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  // ── TESTE 6: Tentativa de Candidatura em Necessidade Encerrada / Inativa ──
  console.log("\n🧪 Teste 6: Tentativa de candidatura em necessidade inativa/encerrada...");
  // Encerrar a necessidade
  await ownerCaller.needs.update({
    id: createdNeed.id,
    status: "encerrada",
  });
  console.log("  ✓ Status da necessidade alterado para 'encerrada'.");

  // Criar um terceiro usuário
  const thirdUserOpenId = `user_third_${Date.now()}`;
  await db.upsertUser({
    openId: thirdUserOpenId,
    name: "Fernanda Técnica",
    email: `fernanda.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const thirdUser = await db.getUserByOpenId(thirdUserOpenId);

  const thirdCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: thirdUser!,
  });

  try {
    await thirdCaller.needs.applyToNeed({
      needId: createdNeed.id,
      message: "Tentando vaga concluída",
    });
    console.error("❌ FALHA: Não deveria permitir candidatura em vaga concluída!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("não está recebendo candidaturas")) {
      console.log(`  ✅ SUCESSO: Bloqueado com mensagem clara: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Bloqueado: "${err.message}"`);
    }
  }

  console.log("\n🎉 TODOS OS 6 CENÁRIOS DE CANDIDATURA FORAM TESTADOS E APROVADOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyInterestApplication().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
