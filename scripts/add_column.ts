import { config } from "dotenv";
config();
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (db) {
    try {
      await db.execute(sql`ALTER TABLE providers ADD COLUMN allow_scheduling boolean;`);
      console.log("Column added!");
    } catch (e: any) {
      if (e.message.includes("already exists")) {
        console.log("Column already exists.");
      } else {
        console.error(e);
      }
    }
  } else {
    console.error("DB connection failed.");
  }
  process.exit(0);
}
main();
