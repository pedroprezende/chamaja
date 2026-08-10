import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";
import { sql } from "drizzle-orm";

async function runVerification() {
  console.log("=== INICIANDO TESTE REAL DE PUBLICAÇÃO DE NECESSIDADE (PWA + SITE) ===");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados não disponível!");
    process.exit(1);
  }

  // 1. Criar usuário de teste PWA
  const pwaOpenId = `user_test_pwa_${Date.now()}`;
  await db.upsertUser({
    openId: pwaOpenId,
    name: "Ana Beatriz (PWA)",
    email: `ana.beatriz.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const pwaUser = await db.getUserByOpenId(pwaOpenId);
  console.log("✓ Usuário PWA criado/autenticado:", pwaUser?.name, `(${pwaOpenId})`);

  // 2. Publicar necessidade via PWA
  const pwaCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: pwaUser!,
  });

  const pwaNeedData = {
    title: "Conserto de Vazamento em Cano de Cozinha",
    description: "Preciso de um encanador urgente para localizar e vedar vazamento embaixo da pia da cozinha.",
    category: "Reformas e Reparos",
    categoryId: "reformas-reparos",
    subcategoryId: "encanador",
    subcategoryName: "Encanador",
    requiredProfessionals: 1,
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    startTime: "14:00",
    endTime: "16:00",
    budget: 150.00,
    paymentType: "total" as const,
    address: "Rua Coronel Teófilo Leme, 450",
    neighborhood: "Centro",
    city: "Bragança Paulista",
    latitude: -22.9515,
    longitude: -46.5412,
    requirements: "Trazer veda rosca, ferramentas e peças de reposição padrão",
    notes: "Casa com cachorro, mas estará preso",
    photos: ["https://d2xsxph8kpxj0f.cloudfront.net/test-foto-cano.jpg"],
  };

  const pwaResult = await pwaCaller.needs.create(pwaNeedData);
  console.log("✓ Necessidade PWA criada com sucesso! ID:", pwaResult.id);

  // 3. Criar usuário de teste Web
  const webOpenId = `user_test_web_${Date.now()}`;
  await db.upsertUser({
    openId: webOpenId,
    name: "Carlos Eduardo (Site Web)",
    email: `carlos.eduardo.${Date.now()}@teste.com`,
    loginMethod: "email",
  });
  const webUser = await db.getUserByOpenId(webOpenId);
  console.log("✓ Usuário Web criado/autenticado:", webUser?.name, `(${webOpenId})`);

  // 4. Publicar necessidade via Web
  const webCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: webUser!,
  });

  const webNeedData = {
    title: "Instalação de Ar Condicionado Split 12.000 BTUs",
    description: "Necessito de técnico para instalar ar condicionado split em consultório comercial com tubulação pronta.",
    category: "Assistência Técnica",
    categoryId: "assistencia-tecnica",
    subcategoryId: "ar-condicionado",
    subcategoryName: "Ar Condicionado",
    requiredProfessionals: 1,
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    startTime: "09:00",
    endTime: "12:00",
    budget: 350.00,
    paymentType: "total" as const,
    address: "Avenida Dom Pedro I, 800",
    neighborhood: "Taboão",
    city: "Bragança Paulista",
    latitude: -22.9640,
    longitude: -46.5380,
    requirements: "Emitir laudo/comprovante de instalação e teste de vácuo",
    notes: "Prédio comercial com elevador de serviço",
    photos: ["https://d2xsxph8kpxj0f.cloudfront.net/test-ar.jpg"],
  };

  const webResult = await webCaller.needs.create(webNeedData);
  console.log("✓ Necessidade Web criada com sucesso! ID:", webResult.id);

  // 5. Verificar no PostgreSQL via SQL direto
  const rows = await dbInstance.execute(
    sql`SELECT id, user_id, title, category, budget, payment_type, city, status, created_at FROM needs WHERE id IN (${pwaResult.id}, ${webResult.id})`
  );
  console.log("\n=== REGISTROS ENCONTRADOS DIRETAMENTE NO POSTGRESQL ===");
  console.table(rows);

  // 6. Testar getById para ambas
  const pwaGet = await pwaCaller.needs.getById({ id: pwaResult.id });
  const webGet = await webCaller.needs.getById({ id: webResult.id });

  console.log("\n✓ Verificação getById PWA:", {
    id: pwaGet.id,
    title: pwaGet.title,
    creatorName: pwaGet.creatorName,
    city: pwaGet.city,
    budget: pwaGet.budget,
    status: pwaGet.status,
  });

  console.log("✓ Verificação getById Web:", {
    id: webGet.id,
    title: webGet.title,
    creatorName: webGet.creatorName,
    city: webGet.city,
    budget: webGet.budget,
    status: webGet.status,
  });

  console.log("\n🎉 TESTE CONCLUÍDO COM 100% DE SUCESSO!");
  process.exit(0);
}

runVerification().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
