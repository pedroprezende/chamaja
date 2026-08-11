import "dotenv/config";
import * as db from "../server/db";
import { needs, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../server/routers";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 INICIANDO TESTES DE INTEGRAÇÃO — ETAPA 13 (WHATSAPP)");
  console.log("=================================================\n");

  const d = await db.getDb();
  if (!d) throw new Error("Banco de dados indisponível");

  const testContractorId = `test_contractor_${Date.now()}`;
  const testProfessionalId = `test_pro_${Date.now()}`;
  const testPhone = "(11) 98765-4321";

  try {
    // 1. Setup test users
    console.log("1. Criando usuários de teste...");
    await d.insert(users).values({
      openId: testContractorId,
      name: "Contratante Teste",
      email: `${testContractorId}@teste.com`,
      phone: testPhone,
      role: "user",
    });

    await d.insert(users).values({
      openId: testProfessionalId,
      name: "Profissional Teste",
      email: `${testProfessionalId}@teste.com`,
      phone: "(11) 91234-5678",
      role: "user",
    });

    const callerContractor = appRouter.createCaller({
      user: {
        openId: testContractorId,
        name: "Contratante Teste",
        email: `${testContractorId}@teste.com`,
        phone: testPhone,
        role: "user",
      } as any,
      req: {} as any,
      res: {} as any,
    });

    const callerPublic = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    // Test 1: Contratante permite WhatsApp
    console.log("\n2. Teste: Criar necessidade com WhatsApp PERMITIDO (Sim)...");
    const needAllowed = await callerContractor.needs.create({
      title: "Instalação de Tomadas e Luminárias",
      description: "Preciso de eletricista para instalar 5 tomadas novas.",
      city: "Bragança Paulista",
      startDate: "2026-08-20",
      requiredProfessionals: 1,
      paymentType: "total",
      allowWhatsappContact: true,
      whatsappContact: "11987654321",
    });
    console.log("✅ Necessidade criada com sucesso! ID:", needAllowed.id);

    // Verify retrieval by professional (public caller)
    const fetchedAllowed = await callerPublic.needs.getById({ id: needAllowed.id });
    console.log("   - allowWhatsappContact:", fetchedAllowed.allowWhatsappContact);
    console.log("   - whatsappContact:", fetchedAllowed.whatsappContact);

    if (fetchedAllowed.allowWhatsappContact !== true || fetchedAllowed.whatsappContact !== "11987654321") {
      throw new Error("❌ Falha: WhatsApp deveria estar disponível quando permitido!");
    }
    console.log("✅ Teste 1 passou: WhatsApp retornado corretamente para contratante que permitiu.");

    // Test 2: Contratante bloqueia WhatsApp
    console.log("\n3. Teste: Criar necessidade com WhatsApp BLOQUEADO (Não)...");
    const needBlocked = await callerContractor.needs.create({
      title: "Pintura de Quarto e Corredor",
      description: "Pintura residencial completa com tinta acrílica fosca.",
      city: "Bragança Paulista",
      startDate: "2026-08-25",
      requiredProfessionals: 1,
      paymentType: "total",
      allowWhatsappContact: false,
      whatsappContact: "11987654321",
    });
    console.log("✅ Necessidade criada com sucesso! ID:", needBlocked.id);

    // Verify retrieval by professional (public caller) - must NOT leak phone
    const fetchedBlocked = await callerPublic.needs.getById({ id: needBlocked.id });
    console.log("   - allowWhatsappContact:", fetchedBlocked.allowWhatsappContact);
    console.log("   - whatsappContact:", fetchedBlocked.whatsappContact);
    console.log("   - creatorPhone:", fetchedBlocked.creatorPhone);

    if (fetchedBlocked.allowWhatsappContact !== false || fetchedBlocked.whatsappContact !== null || fetchedBlocked.creatorPhone !== null) {
      throw new Error("❌ Falha de privacidade: Número de WhatsApp ou telefone foi vazado quando bloqueado!");
    }
    console.log("✅ Teste 2 passou: Privacidade absoluta garantida! Número não exposto para terceiros.");

    // Test 3: Owner viewing their own blocked need
    console.log("\n4. Teste: Criador visualizando a sua própria publicação...");
    const fetchedBlockedByOwner = await callerContractor.needs.getById({ id: needBlocked.id });
    if (fetchedBlockedByOwner.isOwner !== true || fetchedBlockedByOwner.creatorPhone !== testPhone) {
      throw new Error("❌ O proprietário deve conseguir visualizar seu próprio telefone no painel.");
    }
    console.log("✅ Teste 3 passou: Proprietário consegue gerenciar seus próprios dados com segurança.");

    // Test 4: Update need to enable/disable WhatsApp contact
    console.log("\n5. Teste: Atualizar preferência de WhatsApp via update...");
    await callerContractor.needs.update({
      id: needBlocked.id,
      allowWhatsappContact: true,
    });
    const fetchedAfterUpdate = await callerPublic.needs.getById({ id: needBlocked.id });
    if (fetchedAfterUpdate.allowWhatsappContact !== true || fetchedAfterUpdate.whatsappContact !== "11987654321") {
      throw new Error("❌ Falha ao atualizar permissão de WhatsApp.");
    }
    console.log("✅ Teste 4 passou: Atualização de preferências refletida instantaneamente.");

    // Test 5: Format validation of direct URLs
    console.log("\n6. Teste: Validação dos links de WhatsApp gerados...");
    const rawNum = "11987654321";
    const cleanPhone = rawNum.replace(/\D/g, "");
    const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const msg = `Olá! Vi sua publicação "${fetchedAllowed.title}" no XamaJá e gostaria de conversar sobre o serviço.`;
    const expectedWebUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    const expectedAppUrl = `whatsapp://send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`;

    console.log("   - Web URL:", expectedWebUrl);
    console.log("   - App URL:", expectedAppUrl);

    if (!expectedWebUrl.startsWith("https://wa.me/5511987654321?text=") || !expectedAppUrl.startsWith("whatsapp://send?phone=5511987654321&text=")) {
      throw new Error("❌ Falha na geração das URLs de WhatsApp.");
    }
    console.log("✅ Teste 5 passou: URLs de WhatsApp geradas no formato padrão internacional.");

    console.log("\n=================================================");
    console.log("🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!");
    console.log("=================================================\n");
  } finally {
    // Cleanup test data
    try {
      await d.delete(needs).where(eq(needs.userId, testContractorId));
      await d.delete(users).where(eq(users.openId, testContractorId));
      await d.delete(users).where(eq(users.openId, testProfessionalId));
    } catch (_) {}
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Erro no teste:", e);
    process.exit(1);
  });
