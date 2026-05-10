import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const SEED_CATEGORIES = [
  { id: "reformas-reparos", name: "Reformas e Reparos", icon: "build", displayOrder: 1 },
  { id: "assistencia-tecnica", name: "Assistência Técnica", icon: "settings", displayOrder: 2 },
  { id: "servicos-domesticos", name: "Serviços Domésticos", icon: "home", displayOrder: 3 },
  { id: "beleza-estetica", name: "Beleza e Estética", icon: "content-cut", displayOrder: 4 },
  { id: "automotivo", name: "Automotivo", icon: "directions-car", displayOrder: 5 },
  { id: "educacao", name: "Aulas e Cursos", icon: "school", displayOrder: 6 },
  { id: "eventos", name: "Eventos", icon: "celebration", displayOrder: 7 },
  { id: "saude", name: "Saúde e Bem-estar", icon: "local-hospital", displayOrder: 8 },
];

const SEED_REGIONS = [
  { id: "braganca-paulista", name: "Bragança Paulista", state: "SP", providerCount: 128, adCount: 12 },
  { id: "atibaia", name: "Atibaia", state: "SP", providerCount: 98, adCount: 8 },
  { id: "extrema", name: "Extrema", state: "MG", providerCount: 45, adCount: 4 },
  { id: "itatiba", name: "Itatiba", state: "SP", providerCount: 62, adCount: 6 },
  { id: "joanopolis", name: "Joanópolis", state: "SP", providerCount: 28, adCount: 2 },
  { id: "piracaia", name: "Piracaia", state: "SP", providerCount: 31, adCount: 3 },
];

export const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    const cats = await db.getCategories();
    if (cats.length === 0) {
      await Promise.all(
        SEED_CATEGORIES.map((c) =>
          db.createCategory({ ...c, isActive: true }).catch(() => {})
        )
      );
      return db.getCategories();
    }
    return cats;
  }),

  all: adminProcedure.query(async () => {
    return db.getAllCategories();
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      icon: z.string().default("build"),
    }))
    .mutation(async ({ input }) => {
      const cats = await db.getAllCategories();
      const maxOrder = cats.length > 0 ? Math.max(...cats.map((c) => c.displayOrder)) : -1;
      const id = input.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return db.createCategory({ id, name: input.name, icon: input.icon, displayOrder: maxOrder + 1, isActive: true });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), icon: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategory(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteCategory(input.id);
    }),

  subServices: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.string() }))
      .query(async ({ input }) => {
        return db.getSubServicesByCategoryId(input.categoryId);
      }),

    create: adminProcedure
      .input(z.object({ categoryId: z.string(), name: z.string().min(1), icon: z.string().default("build") }))
      .mutation(async ({ input }) => {
        const existing = await db.getSubServicesByCategoryId(input.categoryId);
        const maxOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.displayOrder)) : -1;
        const id = `${input.categoryId}-${uid()}`;
        return db.createSubService({ id, categoryId: input.categoryId, name: input.name, icon: input.icon, displayOrder: maxOrder + 1, isActive: true });
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteSubService(input.id);
      }),
  }),
});

export const regionsRouter = router({
  list: publicProcedure.query(async () => {
    const regs = await db.getRegions();
    if (regs.length === 0) {
      await Promise.all(
        SEED_REGIONS.map((r) =>
          db.createRegion({ ...r, isActive: true }).catch(() => {})
        )
      );
      return db.getRegions();
    }
    return regs;
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), state: z.string().length(2) }))
    .mutation(async ({ input }) => {
      const id = `${input.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}-${uid()}`;
      return db.createRegion({ id, name: input.name, state: input.state.toUpperCase(), providerCount: 0, adCount: 0, isActive: true });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean().optional(), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateRegion(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteRegion(input.id);
    }),
});
