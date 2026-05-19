import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { whatsappClicks, serviceViews, searchQueries } from "../../drizzle/schema";

export const analyticsRouter = router({
  trackWhatsappClick: publicProcedure
    .input(z.object({
      providerId: z.string().optional(),
      serviceName: z.string().optional(),
      city: z.string().optional(),
      userId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      
      await dbInstance.insert(whatsappClicks).values({
        providerId: input.providerId || null,
        serviceName: input.serviceName || null,
        city: input.city || null,
        userId: input.userId || null,
      });
      
      return { success: true };
    }),

  trackServiceView: publicProcedure
    .input(z.object({
      categoryId: z.string().optional(),
      serviceId: z.string().optional(),
      userId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      
      await dbInstance.insert(serviceViews).values({
        categoryId: input.categoryId || null,
        serviceId: input.serviceId || null,
        userId: input.userId || null,
      });
      
      return { success: true };
    }),

  trackSearch: publicProcedure
    .input(z.object({
      query: z.string(),
      userId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Don't track empty searches
      if (!input.query || input.query.trim() === "") return { success: true };
      
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      
      await dbInstance.insert(searchQueries).values({
        query: input.query.trim().toLowerCase(),
        userId: input.userId || null,
      });
      
      return { success: true };
    }),
});
