import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  whatsappClicks,
  serviceViews,
  searchQueries,
  appEvents,
  providers,
  services,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const analyticsRouter = router({
  trackWhatsappClick: publicProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        serviceName: z.string().optional(),
        city: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      await dbInstance.insert(whatsappClicks).values({
        providerId: input.providerId || null,
        serviceName: input.serviceName || null,
        city: input.city || null,
        userId: input.userId || null,
      });

      await dbInstance.insert(appEvents).values({
        tipoEvento: "clique_whatsapp",
        valor: input.serviceName || null,
        cidade: input.city || null,
        prestadorId: input.providerId || null,
        usuarioId: input.userId || null,
      });

      return { success: true };
    }),

  trackServiceView: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        serviceId: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      await dbInstance.insert(serviceViews).values({
        categoryId: input.categoryId || null,
        serviceId: input.serviceId || null,
        userId: input.userId || null,
      });

      let city = null;
      let valor = null;
      if (input.serviceId) {
        // Query providers
        const provider = await dbInstance
          .select()
          .from(providers)
          .where(eq(providers.id, input.serviceId))
          .limit(1);
        if (provider.length > 0) {
          city = provider[0].city || null;
          valor = provider[0].name || null;
        } else {
          // Query services (admin services)
          const service = await dbInstance
            .select()
            .from(services)
            .where(eq(services.id, input.serviceId))
            .limit(1);
          if (service.length > 0) {
            city = service[0].address || null;
            valor = service[0].name || null;
          }
        }
      }

      await dbInstance.insert(appEvents).values({
        tipoEvento: "visualizacao",
        valor: valor,
        cidade: city,
        prestadorId: input.serviceId || null,
        usuarioId: input.userId || null,
      });

      return { success: true };
    }),

  trackSearch: publicProcedure
    .input(
      z.object({
        query: z.string(),
        userId: z.string().optional(),
        city: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Don't track empty searches
      if (!input.query || input.query.trim() === "") return { success: true };

      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      await dbInstance.insert(searchQueries).values({
        query: input.query.trim().toLowerCase(),
        userId: input.userId || null,
      });

      let city = input.city || null;
      if (!city && input.userId) {
        const provider = await dbInstance
          .select()
          .from(providers)
          .where(eq(providers.userId, input.userId))
          .limit(1);
        if (provider.length > 0) {
          city = provider[0].city || null;
        }
      }

      await dbInstance.insert(appEvents).values({
        tipoEvento: "busca",
        valor: input.query.trim().toLowerCase(),
        cidade: city,
        usuarioId: input.userId || null,
      });

      return { success: true };
    }),
});
