require("dotenv").config();
const postgres = require("postgres");

async function applyRls() {
  console.log("--- Aplicando RLS na tabela admin_user_actions ---");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não definida no arquivo .env.");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("1. Ativando RLS...");
    await sql`ALTER TABLE public.admin_user_actions ENABLE ROW LEVEL SECURITY;`;

    console.log("2. Removendo políticas antigas se existirem...");
    await sql`DROP POLICY IF EXISTS "Admin full access admin_user_actions" ON public.admin_user_actions;`;

    console.log("3. Criando política de acesso total para Admin...");
    await sql`
      CREATE POLICY "Admin full access admin_user_actions" 
      ON public.admin_user_actions 
      FOR ALL 
      USING (public.is_admin());
    `;

    console.log("RLS aplicado com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar RLS:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

applyRls();
