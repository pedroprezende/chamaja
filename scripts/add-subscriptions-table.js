require("dotenv").config();
const postgres = require("postgres");

async function runMigration() {
  console.log(
    "--- Executando Migração da Tabela de Assinaturas (Subscriptions) ---",
  );
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("1. Criando tabela 'subscriptions' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id SERIAL PRIMARY KEY,
        provider_id VARCHAR(64) NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
        gateway_customer_id VARCHAR(255),
        gateway_subscription_id VARCHAR(255),
        plan_type VARCHAR(50) NOT NULL, -- 'monthly', 'annual'
        status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'paused'
        price_cents INTEGER NOT NULL,
        current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        canceled_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    console.log("2. Ativando RLS na tabela 'subscriptions'...");
    await sql`ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;`;

    console.log("3. Removendo políticas antigas se existirem...");
    await sql`DROP POLICY IF EXISTS "Allow users to read own provider subscriptions" ON public.subscriptions;`;
    await sql`DROP POLICY IF EXISTS "Admin full access to subscriptions" ON public.subscriptions;`;

    console.log("4. Criando políticas RLS...");

    // User select policy
    await sql`
      CREATE POLICY "Allow users to read own provider subscriptions" 
      ON public.subscriptions 
      FOR SELECT 
      USING (
        provider_id IN (
          SELECT id FROM public.providers 
          WHERE user_id = auth.jwt() ->> 'sub' 
          OR user_id IN (SELECT open_id FROM public.users WHERE email = auth.jwt() ->> 'email')
        )
      );
    `;

    // Admin full access
    await sql`
      CREATE POLICY "Admin full access to subscriptions" 
      ON public.subscriptions 
      FOR ALL 
      USING (public.is_admin());
    `;

    console.log(
      "5. Buscando profissionais atuais para semear a tabela de assinaturas...",
    );
    const currentProviders = await sql`
      SELECT id, name, plan, plan_expires_at, is_active, status, created_at 
      FROM public.providers 
      WHERE plan IN ('monthly', 'annual');
    `;

    console.log(
      `Encontrados ${currentProviders.length} profissionais com planos contratados.`,
    );

    let insertedCount = 0;
    for (const prov of currentProviders) {
      // Check if a subscription record already exists
      const existing = await sql`
        SELECT id FROM public.subscriptions WHERE provider_id = ${prov.id};
      `;

      if (existing.length === 0) {
        const planType = prov.plan; // 'monthly' or 'annual'
        const priceCents = planType === "monthly" ? 2990 : 29900;

        let status = "active";
        const now = new Date();
        const expiresAt = prov.plan_expires_at
          ? new Date(prov.plan_expires_at)
          : null;

        if (expiresAt && expiresAt < now) {
          status = "past_due";
        } else if (prov.status === "suspenso" || prov.is_active === false) {
          status = "canceled";
        }

        const periodStart = prov.created_at
          ? new Date(prov.created_at)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const periodEnd =
          expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await sql`
          INSERT INTO public.subscriptions (
            provider_id,
            plan_type,
            status,
            price_cents,
            current_period_start,
            current_period_end,
            gateway_customer_id,
            gateway_subscription_id
          ) VALUES (
            ${prov.id},
            ${planType},
            ${status},
            ${priceCents},
            ${periodStart},
            ${periodEnd},
            ${"mock_cus_" + prov.id.substring(0, 10)},
            ${"mock_sub_" + prov.id.substring(0, 10)}
          );
        `;
        insertedCount++;
      }
    }

    console.log(
      `Semeados ${insertedCount} registros de assinaturas na tabela!`,
    );
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao rodar migração de assinaturas:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
