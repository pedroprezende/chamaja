import "dotenv/config";
import postgres from "postgres";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

async function ensureAdminRole() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL não encontrada no .env");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    // Check if admin user exists
    const existing = await sql`
      SELECT open_id, email, role FROM users
      WHERE email = ${ADMIN_EMAIL}
      LIMIT 1
    `;

    if (existing.length === 0) {
      console.log(`Usuário ${ADMIN_EMAIL} não encontrado no banco. Criando...`);
      await sql`
        INSERT INTO users (open_id, email, name, role, tipo, last_signed_in)
        VALUES (${ADMIN_EMAIL}, ${ADMIN_EMAIL}, 'Pedro Admin', 'admin', 'admin', NOW())
        ON CONFLICT (open_id) DO UPDATE SET role = 'admin'
      `;
      console.log(`✅ Usuário admin criado com role = 'admin'`);
    } else {
      const user = existing[0];
      if (user.role === "admin") {
        console.log(`✅ ${ADMIN_EMAIL} já possui role = 'admin'`);
      } else {
        console.log(`⚠️  ${ADMIN_EMAIL} possui role = '${user.role}', atualizando para 'admin'...`);
        await sql`
          UPDATE users SET role = 'admin' WHERE email = ${ADMIN_EMAIL}
        `;
        console.log(`✅ Role atualizada para 'admin'`);
      }
    }

    // Also ensure the admin has a Supabase Auth account
    console.log("\nVerificação concluída. O email admin deve ter:");
    console.log("  - role = 'admin' na tabela users");
    console.log("  - Uma conta Supabase Auth (criada via painel Supabase)");
    console.log("\nSe a conta Supabase Auth não existir, crie manualmente em:");
    console.log("  https://supabase.com/dashboard → Authentication → Users → Invite user");
  } catch (error) {
    console.error("❌ Erro ao verificar/criar role admin:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

ensureAdminRole();
