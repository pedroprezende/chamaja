import "dotenv/config";
import { appRouter } from "../server/routers";
import * as db from "../server/db";

async function verifyClientAppointments() {
  console.log("=== TESTE COMPLETO: AGENDAMENTOS DO CLIENTE NO PWA ===\n");

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    console.error("❌ ERRO: Banco de dados indisponível!");
    process.exit(1);
  }

  // 1. Criar Usuário Cliente
  const clientId = `client_pwa_${Date.now()}`;
  await db.upsertUser({
    openId: clientId,
    name: "Mariana Souza",
    email: `mariana.${Date.now()}@teste.com`,
    loginMethod: "email",
    tipo: "cliente",
  });
  const clientUser = (await db.getUserByOpenId(clientId))!;
  const clientCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: clientUser,
  });

  // 2. Criar Usuário Prestador e Perfil de Estabelecimento/Profissional
  const providerUserId = `prov_user_${Date.now()}`;
  await db.upsertUser({
    openId: providerUserId,
    name: "Dr. Roberto Fisioterapia",
    email: `roberto.${Date.now()}@teste.com`,
    loginMethod: "email",
    tipo: "prestador",
  });
  const providerUser = (await db.getUserByOpenId(providerUserId))!;

  const providerId = `prov_prof_${Date.now()}`;
  await db.createProvider({
    id: providerId,
    userId: providerUserId,
    name: "Dr. Roberto Fisioterapia & RPG",
    category: "Saúde",
    categoryId: "saude",
    city: "Bragança Paulista",
    neighborhood: "Centro",
    phone: "(11) 98765-4321",
    whatsapp: "11987654321",
    description: "Atendimento clínico e domiciliar com agendamento online.",
    plan: "monthly",
    planId: null,
    isActive: true,
    status: "aprovado",
    scheduleSettings: {
      slotDuration: 60,
      breakDuration: 15,
      advanceDays: 30,
      autoConfirm: false,
    },
  });

  const providerCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: providerUser,
  });

  // 3. Criar Agendamento pelo Cliente (fluxo real: agendamento inicial 'pending')
  console.log("🧪 Teste 1: Cliente solicitando agendamento...");
  const appointmentDate = "2026-08-15";
  const createdAppt = await clientCaller.appointments.create({
    providerId: providerId,
    date: appointmentDate,
    startTime: "14:00",
    endTime: "15:00",
    serviceName: "Sessão de Fisioterapia e Avaliação Postural",
    clientName: "Mariana Souza",
    clientPhone: "(11) 99999-8888",
  });

  console.log(`  ✓ Agendamento criado com ID: ${createdAppt.id}`);
  console.log(`  ✓ Retorno da mutação: success = ${createdAppt.success}`);

  if (!createdAppt.success || !createdAppt.id) {
    console.error("❌ FALHA: Falha ao criar agendamento!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Agendamento criado com sucesso.");

  // 4. Consultar agendamentos do cliente via getByUser
  console.log("\n🧪 Teste 2: Consultando lista de agendamentos do cliente (trpc.appointments.getByUser)...");
  const clientAppointments = await clientCaller.appointments.getByUser();
  console.log(`  ✓ Total de agendamentos retornados para o cliente: ${clientAppointments.length}`);

  const foundItem = clientAppointments.find((i: any) => i.appointment.id === createdAppt.id);
  if (!foundItem) {
    console.error("❌ FALHA: Agendamento criado não foi encontrado na listagem do cliente!");
    process.exit(1);
  }

  console.log(`  ✓ Prestador: ${foundItem.provider?.name} (${foundItem.provider?.category})`);
  console.log(`  ✓ WhatsApp Prestador: ${foundItem.provider?.whatsapp}`);
  console.log(`  ✓ Serviço: ${foundItem.appointment.serviceName}`);
  console.log(`  ✓ Data: ${foundItem.appointment.date}`);
  console.log(`  ✓ Horário: ${foundItem.appointment.startTime} às ${foundItem.appointment.endTime}`);
  console.log(`  ✓ Status: ${foundItem.appointment.status}`);

  if (
    foundItem.provider?.name !== "Dr. Roberto Fisioterapia & RPG" ||
    foundItem.appointment.serviceName !== "Sessão de Fisioterapia e Avaliação Postural" ||
    foundItem.appointment.status !== "pending"
  ) {
    console.error("❌ FALHA: Dados do agendamento divergentes do esperado!");
    process.exit(1);
  }
  console.log("  ✅ SUCESSO: Todos os dados do agendamento e prestador retornados com exatidão.");

  // 5. Prestador aprova/confirma agendamento via painel dele
  console.log("\n🧪 Teste 3: Prestador confirmando agendamento (updateStatus -> 'confirmed')...");
  await providerCaller.appointments.updateStatus({
    id: createdAppt.id,
    status: "confirmed",
  });

  const updatedClientAppts = await clientCaller.appointments.getByUser();
  const confirmedItem = updatedClientAppts.find((i: any) => i.appointment.id === createdAppt.id);
  if (!confirmedItem || confirmedItem.appointment.status !== "confirmed") {
    console.error("❌ FALHA: Status deveria estar 'confirmed'!");
    process.exit(1);
  }
  console.log(`  ✅ SUCESSO: Status do agendamento atualizado para '${confirmedItem.appointment.status}'.`);

  // 6. Prestador conclui agendamento
  console.log("\n🧪 Teste 4: Prestador concluindo agendamento (updateStatus -> 'completed')...");
  await providerCaller.appointments.updateStatus({
    id: createdAppt.id,
    status: "completed",
  });

  const completedClientAppts = await clientCaller.appointments.getByUser();
  const completedItem = completedClientAppts.find((i: any) => i.appointment.id === createdAppt.id);
  if (!completedItem || completedItem.appointment.status !== "completed") {
    console.error("❌ FALHA: Status deveria estar 'completed'!");
    process.exit(1);
  }
  console.log(`  ✅ SUCESSO: Status do agendamento atualizado para '${completedItem.appointment.status}'.`);

  // 7. Criar segundo agendamento e cliente cancelando
  console.log("\n🧪 Teste 5: Cliente cancelando um agendamento (updateStatus -> 'canceled')...");
  const secondAppt = await clientCaller.appointments.create({
    providerId: providerId,
    clientName: "Mariana Souza",
    clientPhone: "(11) 99999-8888",
    date: "2026-08-18",
    startTime: "10:00",
    endTime: "11:00",
    serviceName: "Retorno Fisioterapia",
  });

  await clientCaller.appointments.updateStatus({
    id: secondAppt.id,
    status: "canceled",
  });

  const finalClientAppts = await clientCaller.appointments.getByUser();
  const canceledItem = finalClientAppts.find((i: any) => i.appointment.id === secondAppt.id);
  if (!canceledItem || canceledItem.appointment.status !== "canceled") {
    console.error("❌ FALHA: Status cancelado não refletiu corretamente!");
    process.exit(1);
  }
  console.log(`  ✅ SUCESSO: Cancelamento realizado com sucesso (status: '${canceledItem.appointment.status}').`);

  console.log("\n🎉 TODOS OS TESTES DE AGENDAMENTOS DO CLIENTE FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  process.exit(0);
}

verifyClientAppointments().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
