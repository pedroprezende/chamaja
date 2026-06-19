import { z } from "zod";
import { publicProcedure, adminMasterProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { systemLogs } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const logsRouter = router({
  register: publicProcedure
    .input(z.object({
      level: z.enum(["error", "warn", "info"]),
      category: z.string(),
      message: z.string(),
      details: z.string().optional(),
      userId: z.string().optional(),
      platform: z.string().optional(),
      appVersion: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      
      await dbInstance.insert(systemLogs).values({
        level: input.level,
        category: input.category,
        message: input.message,
        details: input.details || null,
        userId: input.userId || null,
        platform: input.platform || null,
        appVersion: input.appVersion || null,
      });
      
      return { success: true };
    }),

  list: adminMasterProcedure
    .query(async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      
      const logs = await dbInstance
        .select()
        .from(systemLogs)
        .orderBy(desc(systemLogs.createdAt))
        .limit(100);
        
      return logs;
    }),
});
