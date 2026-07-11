import { z } from "zod";
import { adminWriteProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { payments, providers, plans, planBenefits } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

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
        planId: z.string().optional(), // NEW: FK to plans table
        billingCycle: z.enum(["monthly", "quarterly", "semiannual", "annual"]).optional(),
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
      const billingCycle = input.billingCycle || (input.plano === "mensal" ? "monthly" : "annual");

      // Calculate expiry based on billing cycle
      if (billingCycle === "monthly") {
        expiryDate.setDate(payDate.getDate() + 30);
      } else if (billingCycle === "quarterly") {
        expiryDate.setDate(payDate.getDate() + 90);
      } else if (billingCycle === "semiannual") {
        expiryDate.setDate(payDate.getDate() + 180);
      } else {
        expiryDate.setDate(payDate.getDate() + 365);
      }

      // Look up plan if planId provided
      let planData: any = null;
      let lockedPrice = input.valor;
      if (input.planId) {
        const [plan] = await dbInstance.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
        if (plan) {
          planData = plan;
          // Get price for the billing cycle
          if (billingCycle === "monthly") lockedPrice = plan.monthlyPrice;
          else if (billingCycle === "quarterly") lockedPrice = plan.quarterlyPrice;
          else if (billingCycle === "semiannual") lockedPrice = plan.semiannualPrice;
          else lockedPrice = plan.annualPrice;
        }
      }

      // Check if plan has verified_badge benefit
      let isVerified = false;
      if (input.planId) {
        const [verifiedBenefit] = await dbInstance.select().from(planBenefits)
          .where(and(eq(planBenefits.planId, input.planId), eq(planBenefits.key, "verified_badge")))
          .limit(1);
        isVerified = !!verifiedBenefit;
      }

      // 1. Insert payment record
      await dbInstance.insert(payments).values({
        prestadorId: input.prestadorId,
        plano: input.plano,
        planId: input.planId || null,
        valor: input.valor,
        dataPagamento: payDate,
        metodo: input.metodo,
        nfcEnviada: input.nfcEnviada,
        dataEnvioNfc: input.dataEnvioNfc ? new Date(input.dataEnvioNfc) : null,
        criadoEm: new Date(),
      });

      // 2. Update provider plan status
      const dbPlanValue = billingCycle === "monthly" ? "monthly" : "annual";
      await dbInstance
        .update(providers)
        .set({
          plan: dbPlanValue, // Keep legacy field
          planId: input.planId || null,
          billingCycle: billingCycle,
          lockedPrice: lockedPrice,
          planExpiresAt: expiryDate,
          planStatus: "ativo",
          planStartedAt: payDate,
          isVerified: isVerified,
          updatedAt: new Date(),
        })
        .where(eq(providers.id, input.prestadorId));

      return { success: true };
    }),
});
