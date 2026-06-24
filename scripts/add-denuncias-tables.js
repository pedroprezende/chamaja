require("dotenv").config();
const postgres = require("postgres");

async function runMigration() {
  console.log("--- Executando Migração de Tabelas de Denúncias ---");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("1. Criando tabela 'denuncias' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.denuncias (
        id SERIAL PRIMARY KEY,
        reporter_id VARCHAR(64) NOT NULL,
        reported_id VARCHAR(64) NOT NULL,
        reported_type VARCHAR(50) NOT NULL, -- 'prestador', 'comercio', 'cliente'
        reason VARCHAR(100) NOT NULL, -- 'perfil_falso', 'golpe', 'informacoes_incorretas', 'comportamento_inadequado', 'outro'
        details TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'resolvido'
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    console.log("2. Criando tabela 'admin_report_actions' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.admin_report_actions (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL, -- 'resolvido', 'suspenso', 'bloqueado'
        reason TEXT NOT NULL,
        admin_email VARCHAR(320) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    console.log("3. Ativando RLS nas tabelas...");
    await sql`ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.admin_report_actions ENABLE ROW LEVEL SECURITY;`;

    console.log("4. Removendo políticas antigas se existirem...");
    await sql`DROP POLICY IF EXISTS "Allow authenticated insert to denuncias" ON public.denuncias;`;
    await sql`DROP POLICY IF EXISTS "Admin full access to denuncias" ON public.denuncias;`;
    await sql`DROP POLICY IF EXISTS "Admin full access to admin_report_actions" ON public.admin_report_actions;`;

    console.log("5. Criando novas políticas RLS...");

    // allow inserts from authenticated users
    await sql`
      CREATE POLICY "Allow authenticated insert to denuncias" 
      ON public.denuncias 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
    `;

    // admin full access to denuncias
    await sql`
      CREATE POLICY "Admin full access to denuncias" 
      ON public.denuncias 
      FOR ALL 
      USING (public.is_admin());
    `;

    // admin full access to admin_report_actions
    await sql`
      CREATE POLICY "Admin full access to admin_report_actions" 
      ON public.admin_report_actions 
      FOR ALL 
      USING (public.is_admin());
    `;

    console.log("Migração de Denúncias concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao rodar migração de denúncias:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
