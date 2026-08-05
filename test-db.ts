import { getDb } from "./server/db";
import { providers, services, users } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const dbInstance = await getDb();
  if (!dbInstance) {
    console.log("No DB connection");
    process.exit(1);
  }

  const provCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(providers);
  const svcCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(services);
  const usrCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(users);

  console.log(`Providers: ${provCount[0].count}`);
  console.log(`Services: ${svcCount[0].count}`);
  console.log(`Users: ${usrCount[0].count}`);
  process.exit(0);
}

main().catch(console.error);
