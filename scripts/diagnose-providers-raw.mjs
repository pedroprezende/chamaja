import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    const services = await sql`SELECT * FROM services`;
    console.log("--- RESULTADOS SERVICOS ---");
    console.log(`Encontrados ${services.length} servicos:`);
    for (const s of services) {
      console.log(`- Nome: ${s.name} | Categoria: ${s.category} | ID: ${s.id} | Ativo: ${s.isActive}`);
    }
    console.log("------------------");
  } catch (err) {
    console.error("Erro na consulta:", err);
  } finally {
    await sql.end();
  }
}
run();
