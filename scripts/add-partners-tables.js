require("dotenv").config();
const postgres = require("postgres");

async function runMigration() {
  console.log("--- Executando Migração de Parceiros e Indicações ---");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("1. Criando tabela 'partners' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.partners (
        id VARCHAR(64) PRIMARY KEY,
        nome TEXT NOT NULL,
        email VARCHAR(320) NOT NULL UNIQUE,
        telefone VARCHAR(50) NOT NULL,
        cidade VARCHAR(255) NOT NULL,
        codigo_indicacao VARCHAR(50) NOT NULL UNIQUE,
        comissao REAL DEFAULT 0,
        pagamento_comissao REAL DEFAULT 0,
        plano_associado VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    console.log("2. Criando tabela 'referrals' se não existir...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.referrals (
        id SERIAL PRIMARY KEY,
        partner_id VARCHAR(64) NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
        codigo_indicacao VARCHAR(50) NOT NULL,
        nome_indicado TEXT NOT NULL,
        telefone_indicado VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'novo' NOT NULL, -- novo, contatado, cadastrado, ativo
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    console.log("3. Ativando RLS nas tabelas...");
    await sql`ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;`;

    console.log("4. Removendo políticas de segurança antigas se existirem...");
    await sql`DROP POLICY IF EXISTS "Admin select partners" ON public.partners;`;
    await sql`DROP POLICY IF EXISTS "Partner select own" ON public.partners;`;
    await sql`DROP POLICY IF EXISTS "Partner update own" ON public.partners;`;
    await sql`DROP POLICY IF EXISTS "Admin select referrals" ON public.referrals;`;
    await sql`DROP POLICY IF EXISTS "Partner select own referrals" ON public.referrals;`;
    await sql`DROP POLICY IF EXISTS "Admin update referrals" ON public.referrals;`;

    console.log("5. Criando políticas de segurança RLS...");
    // Políticas para 'partners'
    await sql`CREATE POLICY "Admin select partners" ON public.partners FOR SELECT USING (public.is_admin());`;
    await sql`CREATE POLICY "Partner select own" ON public.partners FOR SELECT USING (auth.uid()::text = id);`;
    await sql`CREATE POLICY "Partner update own" ON public.partners FOR UPDATE USING (auth.uid()::text = id);`;

    // Políticas para 'referrals'
    await sql`CREATE POLICY "Admin select referrals" ON public.referrals FOR SELECT USING (public.is_admin());`;
    await sql`CREATE POLICY "Partner select own referrals" ON public.referrals FOR SELECT USING (auth.uid()::text = partner_id);`;
    await sql`CREATE POLICY "Admin update referrals" ON public.referrals FOR UPDATE USING (public.is_admin());`;

    console.log("Migração de Parceiros concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao rodar migração de parceiros:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
