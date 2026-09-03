require("dotenv").config();
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const schema = require("./dist/drizzle/schema.js");
const { eq, or } = require("drizzle-orm");

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
  try {
    const res = await db
      .select({
        provider: schema.providers,
      })
      .from(schema.providers)
      .where(
        or(
          eq(schema.providers.id, "1785335085028-hftnlpe"),
          eq(schema.providers.userId, "1785335085028-hftnlpe"),
          eq(schema.providers.serviceId, "1785335085028-hftnlpe")
        )
      )
      .limit(1);
    console.log("Drizzle success:", res);
  } catch (e) {
    console.error("Drizzle Error Message:", e.message);
    console.error("Drizzle Error Full:", e);
  } finally {
    process.exit(0);
  }
}
main();
