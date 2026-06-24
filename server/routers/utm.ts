import { z } from "zod";
import { adminWriteProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { utmLinks, appEvents } from "../../drizzle/schema";
import { eq, desc, count, and, isNotNull, ne } from "drizzle-orm";

export const utmRouter = router({
  listAll: adminWriteProcedure.query(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not found");

    // 1. Get all UTM links
    const links = await dbInstance
      .select()
      .from(utmLinks)
      .orderBy(desc(utmLinks.criadoEm));

    // 2. Fetch registrations (prestadores) count from app_events grouped by utm_source
    // Registration event matches: tipoEvento = 'cadastro', utmSource is filled
    const registrations = await dbInstance
      .select({
        utmSource: appEvents.utmSource,
        count: count(),
      })
      .from(appEvents)
      .where(
        and(
          eq(appEvents.tipoEvento, "cadastro"),
          isNotNull(appEvents.utmSource),
          ne(appEvents.utmSource, ""),
        ),
      )
      .groupBy(appEvents.utmSource);

    const regMap = new Map(registrations.map((r) => [r.utmSource, r.count]));

    return links.map((link) => ({
      ...link,
      registrationsCount: regMap.get(link.source) || 0,
    }));
  }),

  generate: adminWriteProcedure
    .input(
      z.object({
        source: z.string().min(1),
        medium: z.string().min(1),
        campaign: z.string().min(1),
        linkCompleto: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      await dbInstance.insert(utmLinks).values({
        source: input.source,
        medium: input.medium,
        campaign: input.campaign,
        linkCompleto: input.linkCompleto,
        criadoEm: new Date(),
      });

      return { success: true };
    }),
});
