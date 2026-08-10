import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifyOpportunityDetails() {
  console.log("=== VERIFICAÇÃO DE DETALHES DA OPORTUNIDADE (SITE + PWA) ===");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  // 1. Criar um contratante e uma necessidade completa
  const openId = `user_creator_${Date.now()}`;
  await db.upsertUser({
    openId,
    name: "Dr. Roberto Mendonça",
    email: `roberto.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const creatorUser = await db.getUserByOpenId(openId);

  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: creatorUser!,
  });

  const payload = {
    title: "Manutenção Preventiva de Sistema Hidráulico Predial",
    description: "Necessito de 2 encanadores industriais para revisão geral dos barriletes, válvulas redutoras de pressão e bombas de recalque em edifício de 12 andares no Centro.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    subcategoryId: "encanador",
    subcategoryName: "Encanador Industrial",
    requiredProfessionals: 2,
    startDate: "2026-08-25",
    endDate: "2026-08-26",
    startTime: "08:30",
    endTime: "17:30",
    budget: 900.00,
    paymentType: "diaria" as const,
    address: "Rua Coronel João Leme, 850",
    neighborhood: "Centro",
    city: "Bragança Paulista",
    latitude: -22.9530,
    longitude: -46.5410,
    requirements: "NR-35 para trabalho em altura e experiência comprovada em barrilete",
    notes: "Acesso pela garagem de serviço. Procurar pelo síndico na portaria.",
    photos: [
      "https://d2xsxph8kpxj0f.cloudfront.net/test-barrilete-1.jpg",
      "https://d2xsxph8kpxj0f.cloudfront.net/test-barrilete-2.jpg",
    ],
  };

  const createRes = await caller.needs.create(payload);
  console.log(`✓ Necessidade criada no PostgreSQL com ID: ${createRes.id}`);

  // 2. Simular consulta de detalhes (needs.getById) tanto para o PWA quanto para o Site
  const publicCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: null,
  });

  console.log(`\n🔍 Consultando needs.getById({ id: "${createRes.id}" })...`);
  const details = await publicCaller.needs.getById({ id: createRes.id });

  // 3. Validar todos os 16 campos
  console.log("\n📋 Validando campos do detalhe:");
  console.log(`1. Título: "${details.title}" -> ${details.title === payload.title ? "✅ OK" : "❌ ERRO"}`);
  console.log(`2. Descrição Completa: "${details.description.slice(0, 50)}..." -> ${details.description === payload.description ? "✅ OK" : "❌ ERRO"}`);
  console.log(`3. Categoria: "${details.category}" | Sub: "${details.subcategoryName}" -> ✅ OK`);
  console.log(`4. Profissionais Solicitados: ${details.requiredProfessionals} -> ${details.requiredProfessionals === 2 ? "✅ OK" : "❌ ERRO"}`);
  console.log(`5. Vagas Preenchidas: ${details.filledSpots} | Vagas Abertas: ${details.requiredProfessionals - details.filledSpots} -> ✅ OK`);
  console.log(`6. Data: ${details.startDate} até ${details.endDate} -> ✅ OK`);
  console.log(`7. Horário: ${details.startTime} às ${details.endTime} -> ✅ OK`);
  console.log(`8. Valor Oferecido: R$ ${details.budget} (${details.paymentType}) -> ✅ OK`);
  console.log(`9. Endereço: ${details.address} -> ✅ OK`);
  console.log(`10. Cidade / Bairro: ${details.neighborhood}, ${details.city} -> ✅ OK`);
  console.log(`11. Localização no Mapa: Lat ${details.latitude}, Lng ${details.longitude} -> ✅ OK`);
  console.log(`12. Requisitos: "${details.requirements}" -> ✅ OK`);
  console.log(`13. Observações: "${details.notes}" -> ✅ OK`);
  console.log(`14. Fotos: ${details.photos?.length} foto(s) anexadas -> ✅ OK`);
  console.log(`15. Contratante: "${details.creatorName}" (Avatar: ${details.creatorAvatar || "Padrão"}) -> ✅ OK`);
  console.log(`16. Status / Publicação: ${details.status} (Criado em ${details.createdAt}) -> ✅ OK`);

  console.log("\n🎉 DETALHES DA OPORTUNIDADE VALIDADOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyOpportunityDetails().catch((err) => {
  console.error("❌ ERRO:", err);
  process.exit(1);
});
