import { z } from "zod";
import {
  publicProcedure,
  adminProcedure,
  adminWriteProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const servicesRouter = router({
  list: publicProcedure
    .input(z.object({ homeOnly: z.boolean().optional() }).optional())
    .query(async () => {
      // O usuário quer ver os prestadores reais (Pedro Automotivo, etc.)
      return db.getProviders();
    }),

  all: adminProcedure.query(async () => {
    return db.getServices(false);
  }),

  getByCategory: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ input }) => {
      const all = await db.getServices(true);
      return all.filter(
        (s) =>
          s.categoryId === input.categoryId ||
          s.subcategoryId === input.categoryId,
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getServiceById(input.id);
    }),

  create: adminWriteProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string(),
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
        subcategoryName: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUri: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        showOnHome: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = uid();
      const allServices = await db.getServices(false);
      const maxOrder =
        allServices.length > 0
          ? Math.max(...allServices.map((s) => s.displayOrder))
          : -1;

      return db.createService({
        id,
        adminId: ctx.user.openId,
        name: input.name,
        category: input.category,
        categoryId: input.categoryId ?? null,
        subcategoryId: input.subcategoryId ?? null,
        subcategoryName: input.subcategoryName ?? null,
        description: input.description ?? null,
        icon: input.icon ?? null,
        imageUri: input.imageUri ?? null,
        whatsapp: input.whatsapp ?? null,
        address: input.address ?? null,
        gallery: input.gallery ?? null,
        showOnHome: input.showOnHome ?? true,
        displayOrder: maxOrder + 1,
        isActive: true,
      });
    }),

  update: adminWriteProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        category: z.string().optional(),
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
        subcategoryName: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUri: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        showOnHome: z.boolean().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateService(id, data);
    }),

  delete: adminWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteService(input.id);
    }),

  reorder: adminWriteProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.ids.map((id, idx) => db.updateService(id, { displayOrder: idx })),
      );
    }),
});
