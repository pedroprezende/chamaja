require("dotenv").config();
const postgres = require("postgres");

async function seed() {
  console.log("--- Semeando Dados Financeiros Mockados ---");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    // 1. Fetch current users to see if we have some
    const currentUsers = await sql`SELECT open_id FROM public.users LIMIT 20;`;

    // 2. Fetch current providers
    const currentProviders =
      await sql`SELECT id FROM public.providers LIMIT 20;`;

    console.log(
      `Bando de dados possui atualmente ${currentUsers.length} usuários e ${currentProviders.length} profissionais.`,
    );

    // If there are no users/providers, let's create 10 mock users and professionals
    if (currentProviders.length === 0) {
      console.log(
        "Sem profissionais no banco. Criando profissionais mockados...",
      );
      const mockNames = [
        "Silva Pinturas",
        "Clínica Dentária Sorriso",
        "Mendes Encanamentos",
        "João da Limpeza",
        "Carlos Eletricista",
        "Pet Shop Banho & Tosa",
        "Dra. Maria Advocacia",
        "Salão de Beleza Glamour",
        "Mercado do Bairro",
        "Auto Mecânica Express",
      ];
      const categories = [
        "Construção",
        "Saúde",
        "Reformas",
        "Diarista",
        "Eletricista",
        "Animais",
        "Serviços",
        "Beleza",
        "comercios",
        "Mecânica",
      ];
      const categoryIds = [
        "pintura",
        "saude",
        "encanador",
        "limpeza",
        "eletricista",
        "petshop",
        "advogado",
        "salao",
        "comercios",
        "mecanica",
      ];
      const cities = [
        "Bragança Paulista",
        "Atibaia",
        "São Paulo",
        "Bragança Paulista",
        "Campinas",
      ];

      for (let i = 0; i < mockNames.length; i++) {
        const openId = `mock_user_id_${i + 1}`;
        const providerId = `mock_prov_id_${i + 1}`;
        const name = mockNames[i];
        const category = categories[i];
        const categoryId = categoryIds[i];
        const city = cities[i % cities.length];
        const phone = `(11) 98765-432${i}`;
        const email = `contato_${i}@mock.com`;

        // Create User
        await sql`
          INSERT INTO public.users (open_id, name, email, role, created_at)
          VALUES (${openId}, ${name}, ${email}, 'user', NOW() - INTERVAL '180 days')
          ON CONFLICT (open_id) DO NOTHING;
        `;

        // Create Provider
        await sql`
          INSERT INTO public.providers (
            id, user_id, name, category, category_id, city, phone, whatsapp, 
            plan, plan_expires_at, is_active, status, created_at
          ) VALUES (
            ${providerId}, ${openId}, ${name}, ${category}, ${categoryId}, ${city}, 
            ${phone}, ${phone}, 'free', null, true, 'ativo', NOW() - INTERVAL '180 days'
          );
        `;
      }
      console.log("10 profissionais e usuários mockados criados.");
    }

    // Refresh list of providers
    const providers =
      await sql`SELECT id, name, created_at FROM public.providers LIMIT 15;`;

    // 3. Make some providers Premium (monthly and annual)
    console.log("Atualizando planos de profissionais e criando assinaturas...");
    const planTypes = [
      "monthly",
      "annual",
      "monthly",
      "monthly",
      "annual",
      "monthly",
      "free",
    ];
    const statuses = [
      "active",
      "active",
      "active",
      "past_due",
      "canceled",
      "active",
      "free",
    ];

    const now = new Date();

    for (let i = 0; i < providers.length; i++) {
      const prov = providers[i];
      const plan = planTypes[i % planTypes.length];
      const status = statuses[i % statuses.length];

      if (plan === "free") {
        await sql`
          UPDATE public.providers 
          SET plan = 'free', plan_expires_at = null, is_active = true, status = 'ativo' 
          WHERE id = ${prov.id};
        `;
        continue;
      }

      // Premium plans expires details
      let expiresAt;
      if (status === "active") {
        expiresAt = new Date(
          now.getTime() + (plan === "annual" ? 180 : 20) * 24 * 60 * 60 * 1000,
        );
      } else if (status === "past_due") {
        expiresAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // expired 5 days ago
      } else {
        expiresAt = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // expired 60 days ago
      }

      const providerStatus =
        status === "canceled"
          ? "inativo"
          : status === "past_due"
            ? "ativo"
            : "ativo";
      const providerActive = status === "active";

      await sql`
        UPDATE public.providers 
        SET plan = ${plan}, plan_expires_at = ${expiresAt}, is_active = ${providerActive}, status = ${providerStatus}
        WHERE id = ${prov.id};
      `;

      // Create subscription record
      const priceCents = plan === "monthly" ? 2990 : 29900;
      const periodStart = prov.created_at
        ? new Date(prov.created_at)
        : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Clean existing subscription
      await sql`DELETE FROM public.subscriptions WHERE provider_id = ${prov.id};`;

      await sql`
        INSERT INTO public.subscriptions (
          provider_id, plan_type, status, price_cents, current_period_start, current_period_end, 
          gateway_customer_id, gateway_subscription_id, cancel_at_period_end, canceled_at
        ) VALUES (
          ${prov.id}, ${plan}, ${status}, ${priceCents}, ${periodStart}, ${expiresAt},
          ${"cus_" + prov.id.substring(0, 10)}, ${"sub_" + prov.id.substring(0, 10)},
          ${status === "canceled"}, ${status === "canceled" ? new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000) : null}
        );
      `;

      // 4. Create historical payments in pagamentos
      console.log(
        `Gerando pagamentos históricos para o profissional ${prov.name}...`,
      );
      // Clean existing payments for this provider to avoid duplicates
      await sql`DELETE FROM public.pagamentos WHERE prestador_id = ${prov.id};`;

      const numPayments = plan === "annual" ? 1 : 5; // Annual pays once, Monthly pays multiple times
      const priceVal = plan === "monthly" ? 29.9 : 299.0;

      for (let j = 0; j < numPayments; j++) {
        // Space payments monthly
        const payDate = new Date(now.getTime() - j * 30 * 24 * 60 * 60 * 1000);
        // Skip if payment date is before provider creation date
        if (prov.created_at && payDate < new Date(prov.created_at)) continue;

        await sql`
          INSERT INTO public.pagamentos (
            prestador_id, plano, valor, data_pagamento, metodo, nfc_enviada, criado_em
          ) VALUES (
            ${prov.id}, ${plan === "monthly" ? "mensal" : "anual"}, ${priceVal}, ${payDate}, 'pix', true, ${payDate}
          );
        `;
      }
    }

    console.log("Semeador financeiro rodou com sucesso!");
  } catch (error) {
    console.error("Erro ao semear dados financeiros:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

seed();
