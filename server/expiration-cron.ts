import { providers, planBenefits } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Hourly cron job that bulk-updates expired providers.
 * Sets planStatus to "expirado" and removes verified badge for expired plans.
 */
export async function checkExpiredPlans() {
  const db = await getDb();
  if (!db) return;

  try {
    // Find providers with active plans that have expired
    const expiredProviders = await db
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          eq(providers.planStatus, "ativo"),
          lt(providers.planExpiresAt, new Date()),
        )
      );

    if (expiredProviders.length === 0) return;

    // Bulk update expired providers
    await db
      .update(providers)
      .set({
        planStatus: "expirado",
        isVerified: false, // Remove verified if plan expired
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(providers.planStatus, "ativo"),
          lt(providers.planExpiresAt, new Date()),
        )
      );

    console.log(`[expiration-cron] Updated ${expiredProviders.length} expired providers`);
  } catch (error) {
    console.error("[expiration-cron] Error checking expired plans:", error);
  }
}

/**
 * Start the hourly expiration check.
 * Call this on server startup.
 */
export function startExpirationCron() {
  // Run immediately on startup
  checkExpiredPlans();

  // Then run every hour
  setInterval(checkExpiredPlans, 60 * 60 * 1000);
}
