import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  const db = await getDb();
  if (db) {
    await db.execute(sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS opportunity_availability jsonb;`);
    console.log("✅ Column 'opportunity_availability' successfully ensured in PostgreSQL table 'providers'.");
  } else {
    console.error("❌ Database connection failed.");
  }
  process.exit(0);
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
