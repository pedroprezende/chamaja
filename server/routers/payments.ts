import { z } from "zod";
import { adminWriteProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { payments, providers } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const paymentsRouter = router({
  listAll: adminWriteProcedure.query(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not found");
    return dbInstance
      .select()
      .from(payments)
      .orderBy(desc(payments.dataPagamento));
  }),

  getByProvider: adminWriteProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      return dbInstance
        .select()
        .from(payments)
        .where(eq(payments.prestadorId, input))
        .orderBy(desc(payments.dataPagamento));
    }),

  register: adminWriteProcedure
    .input(
      z.object({
        prestadorId: z.string(),
        plano: z.enum(["mensal", "anual"]),
        valor: z.number(),
        dataPagamento: z.string(), // ISO String
        metodo: z.string(),
        nfcEnviada: z.boolean().default(false),
        dataEnvioNfc: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      const payDate = new Date(input.dataPagamento);
      const expiryDate = new Date(payDate);
      if (input.plano === "mensal") {
        expiryDate.setDate(payDate.getDate() + 30);
      } else {
        expiryDate.setDate(payDate.getDate() + 365);
      }

      // 1. Insert payment record
      await dbInstance.insert(payments).values({
        prestadorId: input.prestadorId,
        plano: input.plano,
        valor: input.valor,
        dataPagamento: payDate,
        metodo: input.metodo,
        nfcEnviada: input.nfcEnviada,
        dataEnvioNfc: input.dataEnvioNfc ? new Date(input.dataEnvioNfc) : null,
        criadoEm: new Date(),
      });

      // 2. Update provider plan status
      const dbPlanValue = input.plano === "mensal" ? "monthly" : "annual";
      await dbInstance
        .update(providers)
        .set({
          plan: dbPlanValue,
          planExpiresAt: expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(providers.id, input.prestadorId));

      return { success: true };
    }),
});
