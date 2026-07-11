import { z } from "zod";
import {
  publicProcedure,
  adminProcedure,
  adminWriteProcedure,
  router,
} from "../_core/trpc";
import { getDb } from "../db";
import { plans, planBenefits, planPriceHistory } from "../../drizzle/schema";
import { eq, asc, inArray } from "drizzle-orm";

export const plansRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    // Fetch all active plans
    const allPlans = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.displayOrder));
    
    // Fetch benefits for these plans
    if (allPlans.length === 0) return [];
    
    const planIds = allPlans.map(p => p.id);
    const benefits = await db.select().from(planBenefits).where(inArray(planBenefits.planId, planIds)).orderBy(asc(planBenefits.displayOrder));
    
    return allPlans.map(plan => ({
      ...plan,
      benefits: benefits.filter(b => b.planId === plan.id)
    }));
  }),

  all: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const allPlans = await db.select().from(plans).orderBy(asc(plans.displayOrder));
    if (allPlans.length === 0) return [];
    
    const planIds = allPlans.map(p => p.id);
    const benefits = await db.select().from(planBenefits).where(inArray(planBenefits.planId, planIds)).orderBy(asc(planBenefits.displayOrder));
    
    return allPlans.map(plan => ({
      ...plan,
      benefits: benefits.filter(b => b.planId === plan.id)
    }));
  }),

  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    
    const plan = await db.select().from(plans).where(eq(plans.id, input.id)).limit(1).then(r => r[0]);
    if (!plan) return null;
    
    const benefits = await db.select().from(planBenefits).where(eq(planBenefits.planId, plan.id)).orderBy(asc(planBenefits.displayOrder));
    
    return { ...plan, benefits };
  }),

  save: adminWriteProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      monthlyPrice: z.number().min(0),
      quarterlyPrice: z.number().min(0),
      semiannualPrice: z.number().min(0),
      annualPrice: z.number().min(0),
      isActive: z.boolean().default(true),
      displayOrder: z.number().default(0),
      isFeatured: z.boolean().default(false),
      badgeColor: z.string().optional().nullable(),
      applyOnlyToNew: z.boolean().default(false),
      benefits: z.array(z.object({
        id: z.number().optional(),
        key: z.string().min(1),
        name: z.string().min(1),
        displayOrder: z.number()
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const adminId = ctx.user?.openId || "system";

      return await db.transaction(async (tx) => {
        let planId = input.id;
        
        if (planId) {
          // Check for price changes to record history
          const oldPlan = await tx.select().from(plans).where(eq(plans.id, planId)).limit(1).then(r => r[0]);
          
          if (oldPlan) {
            const pricesChanged = 
              oldPlan.monthlyPrice !== input.monthlyPrice ||
              oldPlan.quarterlyPrice !== input.quarterlyPrice ||
              oldPlan.semiannualPrice !== input.semiannualPrice ||
              oldPlan.annualPrice !== input.annualPrice;
              
            if (pricesChanged) {
              await tx.insert(planPriceHistory).values({
                planId,
                adminId,
                oldValues: {
                  monthly: oldPlan.monthlyPrice,
                  quarterly: oldPlan.quarterlyPrice,
                  semiannual: oldPlan.semiannualPrice,
                  annual: oldPlan.annualPrice
                },
                newValues: {
                  monthly: input.monthlyPrice,
                  quarterly: input.quarterlyPrice,
                  semiannual: input.semiannualPrice,
                  annual: input.annualPrice
                }
              });
            }
          }

          // Update plan
          await tx.update(plans).set({
            name: input.name,
            description: input.description,
            monthlyPrice: input.monthlyPrice,
            quarterlyPrice: input.quarterlyPrice,
            semiannualPrice: input.semiannualPrice,
            annualPrice: input.annualPrice,
            isActive: input.isActive,
            displayOrder: input.displayOrder,
            isFeatured: input.isFeatured,
            badgeColor: input.badgeColor,
            applyOnlyToNew: input.applyOnlyToNew,
            updatedAt: new Date()
          }).where(eq(plans.id, planId));
          
        } else {
          // Create plan
          const newPlan = await tx.insert(plans).values({
            name: input.name,
            description: input.description,
            monthlyPrice: input.monthlyPrice,
            quarterlyPrice: input.quarterlyPrice,
            semiannualPrice: input.semiannualPrice,
            annualPrice: input.annualPrice,
            isActive: input.isActive,
            displayOrder: input.displayOrder,
            isFeatured: input.isFeatured,
            badgeColor: input.badgeColor,
            applyOnlyToNew: input.applyOnlyToNew
          }).returning({ id: plans.id }).then(r => r[0]);
          
          planId = newPlan.id;
        }

        // Sync benefits
        // Delete existing ones
        await tx.delete(planBenefits).where(eq(planBenefits.planId, planId));
        
        // Insert new ones
        if (input.benefits.length > 0) {
          const newBenefits = input.benefits.map(b => ({
            planId: planId as string,
            key: b.key,
            name: b.name,
            displayOrder: b.displayOrder
          }));
          await tx.insert(planBenefits).values(newBenefits);
        }
        
        return { success: true, planId };
      });
    }),

  delete: adminWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Soft delete
      await db.update(plans).set({ isActive: false }).where(eq(plans.id, input.id));
      return { success: true };
    }),
});
