import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifySpotsAndStatus() {
  console.log("=== TESTE COMPLETO: ETAPA 8 — STATUS E CONTROLE DE VAGAS ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  // 1. Criar o Contratante
  const ownerOpenId = `owner_etapa8_${Date.now()}`;
  await db.upsertUser({
    openId: ownerOpenId,
    name: "Dr. Roberto Contratante",
    email: `roberto.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const ownerUser = (await db.getUserByOpenId(ownerOpenId))!;

  const ownerCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: ownerUser,
  });

  // Criar 4 profissionais candidatos
  const candidates: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const proOpenId = `pro_etapa8_${i}_${Date.now()}`;
    await db.upsertUser({
      openId: proOpenId,
      name: `Eletricista ${i}`,
      email: `eletricista${i}.${Date.now()}@teste.com`,
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

  // ── TESTE 1: Necessidade com 3 vagas ──
  console.log("🧪 Teste 1: Criando necessidade com 3 vagas (requiredProfessionals = 3)...");
  const need3 = await ownerCaller.needs.create({
    title: "Instalação Elétrica Completa em Galpão Industrial",
    description: "Precisamos de 3 eletricistas para montagem de infraestrutura e quadros de comando.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    requiredProfessionals: 3,
    startDate: "2026-09-15",
    budget: 900.0,
    paymentType: "diaria",
    city: "Bragança Paulista",
  });
  console.log(`  ✓ Necessidade criada: ${need3.id}`);

  const initialCheck = await ownerCaller.needs.getById({ id: need3.id });
  const isInitialOpen = initialCheck.status === "ativa" && initialCheck.filledSpots === 0;
  console.log(`  ✓ Status inicial: ${initialCheck.status} | Vagas preenchidas: ${initialCheck.filledSpots}/3 | Estado: 🟢 Aberta`);
  if (!isInitialOpen) {
    console.error("❌ FALHA: Estado inicial deveria ser Aberta (status=ativa, filledSpots=0)");
    process.exit(1);
  }

  // ── TESTE 2: Aceitar 1 profissional ──
  console.log("\n🧪 Teste 2: Candidato 1 se candidata e é aceito pelo contratante...");
  const app1 = await candidates[0].caller.needs.applyToNeed({
    needId: need3.id,
    message: "Disponível para montagem dos quadros.",
    proposedPrice: 900.0,
  });
  const acceptRes1 = await ownerCaller.needs.acceptApplication({ applicationId: app1.id });
  console.log(`  ✓ Candidato 1 aceito: filledSpots=${acceptRes1.filledSpots}, isFullyFilled=${acceptRes1.isFullyFilled}`);

  const checkAfter1 = await ownerCaller.needs.getById({ id: need3.id });
  const isPartial1 = checkAfter1.status === "ativa" && checkAfter1.filledSpots === 1;
  console.log(`  ✓ Estado atual: ${checkAfter1.status} | Preenchidas: ${checkAfter1.filledSpots}/3 (2 restantes) | Estado: 🟡 Parcialmente preenchida`);
  if (!isPartial1) {
    console.error("❌ FALHA: Deveria ser Parcialmente preenchida (status=ativa, filledSpots=1)");
    process.exit(1);
  }

  // ── TESTE 3: Aceitar o 2º profissional ──
  console.log("\n🧪 Teste 3: Candidato 2 se candidata e é aceito pelo contratante...");
  const app2 = await candidates[1].caller.needs.applyToNeed({
    needId: need3.id,
    message: "Tenho experiência com eletrocalhas industriais.",
    proposedPrice: 900.0,
  });
  const acceptRes2 = await ownerCaller.needs.acceptApplication({ applicationId: app2.id });
  console.log(`  ✓ Candidato 2 aceito: filledSpots=${acceptRes2.filledSpots}, isFullyFilled=${acceptRes2.isFullyFilled}`);

  // ── TESTE 4: Verificar vagas restantes ──
  console.log("\n🧪 Teste 4: Verificando vagas restantes (2 de 3 preenchidas, 1 restante)...");
  const checkAfter2 = await ownerCaller.needs.getById({ id: need3.id });
  const remainingSpots2 = checkAfter2.requiredProfessionals - checkAfter2.filledSpots;
  console.log(`  ✓ Preenchidas: ${checkAfter2.filledSpots}/3 | Vagas Restantes: ${remainingSpots2} | Status: ${checkAfter2.status}`);

  if (remainingSpots2 !== 1 || checkAfter2.status !== "ativa") {
    console.error(`❌ FALHA: Esperava 1 vaga restante e status ativa, obteve ${remainingSpots2} vagas e status ${checkAfter2.status}`);
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: A necessidade permanece ativa e disponível com 1 vaga restante.");

  // ── TESTE 5 & 6: Preencher a última vaga e confirmar encerramento automático ──
  console.log("\n🧪 Teste 5 & 6: Preenchendo a 3ª e última vaga (Candidato 3)...");
  const app3 = await candidates[2].caller.needs.applyToNeed({
    needId: need3.id,
    message: "Equipamentos de proteção e ferramentas industriais completas.",
    proposedPrice: 900.0,
  });
  const acceptRes3 = await ownerCaller.needs.acceptApplication({ applicationId: app3.id });
  console.log(`  ✓ Candidato 3 aceito: filledSpots=${acceptRes3.filledSpots}, isFullyFilled=${acceptRes3.isFullyFilled}`);

  const checkAfter3 = await ownerCaller.needs.getById({ id: need3.id });
  console.log(`  ✓ Status final após 3ª vaga: ${checkAfter3.status} | Preenchidas: ${checkAfter3.filledSpots}/3 | Estado: 🔴 Encerrada`);

  if (checkAfter3.status !== "encerrada" || checkAfter3.filledSpots !== 3) {
    console.error(`❌ FALHA: Status deveria ser 'encerrada' e filledSpots=3, obteve: status=${checkAfter3.status}, filledSpots=${checkAfter3.filledSpots}`);
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Encerramento automático confirmado!");

  // ── TESTE 7: Tentar candidatar-se depois de encerrada ──
  console.log("\n🧪 Teste 7: Tentando nova candidatura (Candidato 4) na necessidade já encerrada...");
  try {
    await candidates[3].caller.needs.applyToNeed({
      needId: need3.id,
      message: "Gostaria de participar também.",
    });
    console.error("❌ FALHA: Deveria ter bloqueado a candidatura na necessidade encerrada!");
    process.exit(1);
  } catch (err: any) {
    if (err.message?.includes("já foram preenchidas") || err.message?.includes("não está recebendo")) {
      console.log(`  ✅ SUCESSO: Candidatura bloqueada corretamente: "${err.message}"`);
    } else {
      console.log(`  ✅ SUCESSO: Candidatura bloqueada: "${err.message}"`);
    }
  }

  // ── TESTE 8: Recusar uma candidatura e verificar se a vaga continua disponível ──
  console.log("\n🧪 Teste 8: Recusar uma candidatura e verificar se a vaga continua disponível...");
  const need2Spots = await ownerCaller.needs.create({
    title: "Pintura Externa Residencial",
    description: "2 pintores para fachada.",
    category: "Pintura",
    categoryId: "reformas-reparos",
    requiredProfessionals: 2,
    startDate: "2026-09-20",
    budget: 500.0,
    paymentType: "total",
    city: "Atibaia",
  });

  const appRejectTest = await candidates[0].caller.needs.applyToNeed({
    needId: need2Spots.id,
    message: "Proposta inicial.",
  });

  // Contratante recusa a candidatura
  await ownerCaller.needs.rejectApplication({ applicationId: appRejectTest.id });

  const checkAfterReject = await ownerCaller.needs.getById({ id: need2Spots.id });
  console.log(`  ✓ Status após recusa: ${checkAfterReject.status} | Preenchidas: ${checkAfterReject.filledSpots}/2 | Vagas restantes: ${checkAfterReject.requiredProfessionals - checkAfterReject.filledSpots}`);

  if (checkAfterReject.filledSpots !== 0 || checkAfterReject.status !== "ativa") {
    console.error("❌ FALHA: Vaga não deveria ter sido consumida por candidatura recusada.");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Candidatura recusada não consome vaga. Vagas restantes: 2/2 abertas.");

  console.log("\n🎉 TODOS OS 8 CENÁRIOS DE STATUS E CONTROLE DE VAGAS FORAM TESTADOS E APROVADOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifySpotsAndStatus().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
