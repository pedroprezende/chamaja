import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const providersRouter = router({
  list: publicProcedure
    .input(z.object({ subcategoryId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.getProviders(true);
    }),

  all: adminProcedure.query(async () => {
    return db.getProviders(false);
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      serviceId: z.string().optional(),
      serviceName: z.string().optional(),
      subcategoryId: z.string().optional(),
      subcategoryName: z.string().optional(),
      whatsapp: z.string().optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      avatarUri: z.string().optional(),
      gallery: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const all = await db.getProviders(false);
      const maxOrder = all.length > 0 ? Math.max(...all.map((p) => p.displayOrder)) : -1;
      const id = uid();
      return db.createProvider({
        id,
        name: input.name,
        serviceId: input.serviceId ?? null,
        serviceName: input.serviceName ?? null,
        subcategoryId: input.subcategoryId ?? null,
        subcategoryName: input.subcategoryName ?? null,
        whatsapp: input.whatsapp ?? null,
        description: input.description ?? null,
        address: input.address ?? null,
        avatarUri: input.avatarUri ?? null,
        gallery: input.gallery ?? null,
        rating: 0,
        ratingCount: 0,
        isActive: true,
        displayOrder: maxOrder + 1,
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      whatsapp: z.string().optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      avatarUri: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProvider(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteProvider(input.id);
    }),
});
