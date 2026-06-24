require("dotenv").config();
const postgres = require("postgres");

async function runMigration() {
  console.log(
    "--- Executando Migração de Configurações e Logs Administrativos ---",
  );
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log(
      "1. Adicionando coluna 'admin_role' na tabela 'users' se não existir...",
    );
    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50);
    `;

    console.log(
      "2. Atualizando e-mail principal para Administrador Principal...",
    );
    await sql`
      UPDATE public.users 
      SET role = 'admin', admin_role = 'principal' 
      WHERE email = 'pedroprezende33@gmail.com';
    `;

    console.log("3. Criando tabela 'app_settings' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by VARCHAR(320)
      );
    `;

    console.log("4. Criando tabela 'admin_activity_logs' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
        id SERIAL PRIMARY KEY,
        admin_email VARCHAR(320) NOT NULL,
        admin_role VARCHAR(50) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log("5. Ativando RLS nas tabelas...");
    await sql`ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;`;

    console.log("6. Removendo políticas antigas se existirem...");
    await sql`DROP POLICY IF EXISTS "Public select on app_settings" ON public.app_settings;`;
    await sql`DROP POLICY IF EXISTS "Admin full access to app_settings" ON public.app_settings;`;
    await sql`DROP POLICY IF EXISTS "Admin full access to admin_activity_logs" ON public.admin_activity_logs;`;

    console.log("7. Criando políticas RLS...");

    // app_settings select policy (public)
    await sql`
      CREATE POLICY "Public select on app_settings" 
      ON public.app_settings 
      FOR SELECT 
      USING (true);
    `;

    // app_settings admin full access
    await sql`
      CREATE POLICY "Admin full access to app_settings" 
      ON public.app_settings 
      FOR ALL 
      USING (public.is_admin());
    `;

    // admin_activity_logs admin full access
    await sql`
      CREATE POLICY "Admin full access to admin_activity_logs" 
      ON public.admin_activity_logs 
      FOR ALL 
      USING (public.is_admin());
    `;

    console.log(
      "8. Semeando chaves de configurações padrão se não existirem...",
    );
    const defaultSettings = [
      { key: "maintenance_mode", value: "false" },
      { key: "contact_whatsapp", value: "(11) 99999-9999" },
      { key: "min_rating_featured", value: "4.5" },
      { key: "app_version", value: "1.0.0" },
    ];

    for (const setting of defaultSettings) {
      const existing = await sql`
        SELECT key FROM public.app_settings WHERE key = ${setting.key};
      `;
      if (existing.length === 0) {
        await sql`
          INSERT INTO public.app_settings (key, value, updated_by)
          VALUES (${setting.key}, ${setting.value}, 'system');
        `;
      }
    }

    console.log(
      "Migração de Configurações Administrativas concluída com sucesso!",
    );
  } catch (error) {
    console.error("Erro ao rodar migração de configurações:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
