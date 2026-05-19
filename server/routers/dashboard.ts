import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { providers, services, featuredAds, whatsappClicks, serviceViews, searchQueries } from "../../drizzle/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const dashboardRouter = router({
  getAdminStats: adminProcedure.query(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not found");

    const [providersCount] = await dbInstance
      .select({ value: count() })
      .from(providers)
      .where(eq(providers.isActive, true));

    const [adsCount] = await dbInstance
      .select({ value: count() })
      .from(featuredAds);

    const [whatsappCount] = await dbInstance
      .select({ value: count() })
      .from(whatsappClicks);

    const [viewsCount] = await dbInstance
      .select({ value: count() })
      .from(serviceViews);

    // Get Top Service from search Queries
    const topSearches = await dbInstance
      .select({
        query: searchQueries.query,
        count: count()
      })
      .from(searchQueries)
      .groupBy(searchQueries.query)
      .orderBy(desc(count()))
      .limit(1);

    const [totalSearchesResult] = await dbInstance
      .select({ value: count() })
      .from(searchQueries);

    let topServiceName = "Nenhum dado";
    let topServicePercentage = 0;

    if (topSearches.length > 0 && totalSearchesResult.value > 0) {
      topServiceName = topSearches[0].query;
      topServicePercentage = Math.round((topSearches[0].count / totalSearchesResult.value) * 100);
      // Capitalize first letter
      topServiceName = topServiceName.charAt(0).toUpperCase() + topServiceName.slice(1);
    }

    // Recent activity: Combine recent providers and maybe services (just providers for now, to keep it simple, or we can fetch both)
    const recentProviders = await dbInstance
      .select()
      .from(providers)
      .orderBy(desc(providers.createdAt))
      .limit(4);

    // Fetch the latest 5 search queries
    const recentSearches = await dbInstance
      .select()
      .from(searchQueries)
      .orderBy(desc(searchQueries.createdAt))
      .limit(5);

    return {
      stats: {
        activeProviders: providersCount.value,
        whatsappClicks: whatsappCount.value,
        serviceViews: viewsCount.value,
        activeAds: adsCount.value,
      },
      recentActivity: recentProviders.map((p) => ({
        id: p.id,
        title: "Novo prestador cadastrado",
        name: p.name,
        time: p.createdAt.toISOString(),
        icon: "person-add",
      })),
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        query: s.query,
        time: s.createdAt.toISOString(),
      })),
      topService: {
        name: topServiceName,
        percentage: topServicePercentage,
        icon: "search",
      },
    };
  }),
});
