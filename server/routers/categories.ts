import { z } from "zod";
import {
  publicProcedure,
  adminProcedure,
  adminWriteProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const SEED_CATEGORIES = [
  {
    id: "reformas-reparos",
    name: "Reformas e Reparos",
    icon: "build",
    displayOrder: 1,
  },
  {
    id: "assistencia-tecnica",
    name: "Assistência Técnica",
    icon: "settings",
    displayOrder: 2,
  },
  {
    id: "servicos-domesticos",
    name: "Serviços Domésticos",
    icon: "home",
    displayOrder: 3,
  },
  {
    id: "servicos-externos",
    name: "Serviços Externos",
    icon: "yard",
    displayOrder: 4,
  },
  {
    id: "automotivo",
    name: "Automotivo",
    icon: "directions-car",
    displayOrder: 5,
  },
  {
    id: "beleza-estetica",
    name: "Beleza e Estética",
    icon: "content-cut",
    displayOrder: 6,
  },
  {
    id: "servicos-profissionais",
    name: "Serviços Profissionais",
    icon: "business-center",
    displayOrder: 7,
  },
  { id: "saude", name: "Saúde", icon: "local-hospital", displayOrder: 8 },
  { id: "eventos", name: "Eventos", icon: "celebration", displayOrder: 9 },
  {
    id: "logistica",
    name: "Logística",
    icon: "local-shipping",
    displayOrder: 10,
  },
  { id: "educacao", name: "Educação", icon: "school", displayOrder: 11 },
  { id: "comercios", name: "Comércios", icon: "storefront", displayOrder: 12 },
  { id: "mobilidade", name: "Mobilidade", icon: "commute", displayOrder: 13 },
  {
    id: "limpeza-especializada",
    name: "Limpeza Especializada",
    icon: "cleaning-services",
    displayOrder: 14,
  },
];

const SEED_REGIONS = [
  {
    id: "braganca-paulista",
    name: "Bragança Paulista",
    state: "SP",
    providerCount: 128,
    adCount: 12,
  },
  {
    id: "atibaia",
    name: "Atibaia",
    state: "SP",
    providerCount: 98,
    adCount: 8,
  },
  {
    id: "extrema",
    name: "Extrema",
    state: "MG",
    providerCount: 45,
    adCount: 4,
  },
  {
    id: "itatiba",
    name: "Itatiba",
    state: "SP",
    providerCount: 62,
    adCount: 6,
  },
  {
    id: "joanopolis",
    name: "Joanópolis",
    state: "SP",
    providerCount: 28,
    adCount: 2,
  },
  {
    id: "piracaia",
    name: "Piracaia",
    state: "SP",
    providerCount: 31,
    adCount: 3,
  },
];

const SEED_SUBSERVICES: Record<string, any[]> = {
  "reformas-reparos": [
    {
      name: "Eletricista",
      icon: "electrical-services",
      imageUrl:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
    },
    {
      name: "Encanador",
      icon: "plumbing",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    },
    {
      name: "Pedreiro",
      icon: "construction",
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    },
    {
      name: "Pintor",
      icon: "format-paint",
      imageUrl:
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80",
    },
    {
      name: "Gesseiro",
      icon: "build",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    },
    {
      name: "Montagem de Móveis",
      icon: "build",
      imageUrl:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    },
    {
      name: "Desmontagem de Móveis",
      icon: "build",
      imageUrl:
        "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&q=80",
    },
  ],
  "assistencia-tecnica": [
    {
      name: "Conserto de Celular",
      icon: "phone-android",
      imageUrl:
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80",
    },
    {
      name: "Técnico de Notebook",
      icon: "laptop",
      imageUrl:
        "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80",
    },
    {
      name: "Ar-condicionado",
      icon: "ac-unit",
      imageUrl:
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
    },
  ],
  "servicos-domesticos": [
    {
      name: "Diarista",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    },
    {
      name: "Faxineira",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    },
    {
      name: "Babá",
      icon: "child-care",
      imageUrl:
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80",
    },
  ],
  automotivo: [
    {
      name: "Mecânico",
      icon: "build",
      imageUrl:
        "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80",
    },
    {
      name: "Lava Rápido",
      icon: "local-car-wash",
      imageUrl:
        "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80",
    },
  ],
  "beleza-estetica": [
    {
      name: "Barbeiro",
      icon: "content-cut",
      imageUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
    },
    {
      name: "Manicure",
      icon: "spa",
      imageUrl:
        "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80",
    },
  ],
  "limpeza-especializada": [
    {
      name: "Higienização de Sofá",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    },
    {
      name: "Higienização de Colchão",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1632829871576-47b2c01950f3?w=500&q=80",
    },
    {
      name: "Limpeza Pós-Obra",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    },
    {
      name: "Limpeza de Vidros",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
    },
    {
      name: "Lavagem de Tapetes",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&q=80",
    },
    {
      name: "Impermeabilização",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    },
    {
      name: "Limpeza Comercial",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80",
    },
    {
      name: "Limpeza de Estofados",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    },
    {
      name: "Sanitização",
      icon: "cleaning-services",
      imageUrl:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80",
    },
  ],
};

export const categoriesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Auto-fix admin for owner
    try {
      const owner = await db.getUserByOpenId(ctx?.user?.openId || "");
      if (
        owner &&
        owner.email === "pedroprezende33@gmail.com" &&
        owner.role !== "admin"
      ) {
        console.log("[AdminFix] Elevating owner to admin role...");
        await db.upsertUser({ openId: owner.openId, role: "admin" });
      }
    } catch (e) {}

    const allCats = await db.getAllCategories();
    console.log(`[Categories] Found ${allCats.length} total categories`);

    if (allCats.length === 0) {
      console.log("[Categories] Database empty, seeding...");
      await Promise.all(
        SEED_CATEGORIES.map((c) =>
          db.createCategory({ ...c, isActive: true }).catch((err) => {
            console.error(`[Categories] Failed to seed ${c.name}:`, err);
          }),
        ),
      );
      return db.getCategories();
    }

    return allCats;
  }),

  all: adminProcedure.query(async () => {
    return db.getAllCategories();
  }),

  create: adminWriteProcedure
    .input(
      z.object({
        name: z.string().min(1),
        icon: z.string().default("build"),
      }),
    )
    .mutation(async ({ input }) => {
      const cats = await db.getAllCategories();
      const maxOrder =
        cats.length > 0 ? Math.max(...cats.map((c) => c.displayOrder)) : -1;
      const id = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return db.createCategory({
        id,
        name: input.name,
        icon: input.icon,
        displayOrder: maxOrder + 1,
        isActive: true,
      });
    }),

  update: adminWriteProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategory(id, data);
    }),

  delete: adminWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteCategory(input.id);
    }),

  subServices: router({
    listAll: publicProcedure.query(async () => {
      const subs = await db.getAllSubServices();
      if (subs.length === 0) {
        console.log("[SubServices] Database empty, seeding all...");
        const allSeedTasks = Object.entries(SEED_SUBSERVICES).flatMap(
          ([catId, items]) =>
            items.map((s, idx) =>
              db
                .createSubService({
                  id: `${catId}-${idx}-${Date.now()}`,
                  categoryId: catId,
                  name: s.name,
                  icon: s.icon,
                  imageUrl: s.imageUrl,
                  displayOrder: idx,
                  isActive: true,
                })
                .catch(() => {}),
            ),
        );
        await Promise.all(allSeedTasks);
        return db.getAllSubServices();
      }
      return subs;
    }),
    list: publicProcedure
      .input(z.object({ categoryId: z.string() }))
      .query(async ({ input }) => {
        const subs = await db.getSubServicesByCategoryId(input.categoryId);
        if (subs.length === 0 && SEED_SUBSERVICES[input.categoryId]) {
          await Promise.all(
            SEED_SUBSERVICES[input.categoryId].map((s, idx) =>
              db
                .createSubService({
                  id: `${input.categoryId}-${idx}-${Date.now()}`,
                  categoryId: input.categoryId,
                  name: s.name,
                  icon: s.icon,
                  imageUrl: s.imageUrl,
                  displayOrder: idx,
                  isActive: true,
                })
                .catch(() => {}),
            ),
          );
          return db.getSubServicesByCategoryId(input.categoryId);
        }
        return subs;
      }),

    create: adminWriteProcedure
      .input(
        z.object({
          categoryId: z.string(),
          name: z.string().min(1),
          icon: z.string().default("build"),
          imageUrl: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const existing = await db.getSubServicesByCategoryId(input.categoryId);
        const maxOrder =
          existing.length > 0
            ? Math.max(...existing.map((s) => s.displayOrder))
            : -1;
        const id = `${input.categoryId}-${uid()}`;
        return db.createSubService({
          id,
          categoryId: input.categoryId,
          name: input.name,
          icon: input.icon,
          imageUrl: input.imageUrl,
          displayOrder: maxOrder + 1,
          isActive: true,
        });
      }),

    delete: adminWriteProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteSubService(input.id);
      }),

    update: adminWriteProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          icon: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSubService(id, data);
      }),
  }),

  reorder: adminWriteProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.ids.map((id, idx) =>
          db.updateCategory(id, { displayOrder: idx }),
        ),
      );
    }),
});

export const regionsRouter = router({
  list: publicProcedure.query(async () => {
    const regs = await db.getRegions();
    if (regs.length === 0) {
      await Promise.all(
        SEED_REGIONS.map((r) =>
          db.createRegion({ ...r, isActive: true }).catch(() => {}),
        ),
      );
      return db.getRegions();
    }
    return regs;
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), state: z.string().length(2) }))
    .mutation(async ({ input }) => {
      const id = `${input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")}-${uid()}`;
      return db.createRegion({
        id,
        name: input.name,
        state: input.state.toUpperCase(),
        providerCount: 0,
        adCount: 0,
        isActive: true,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateRegion(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteRegion(input.id);
    }),
  hello: publicProcedure.query(() => {
    return { message: "Servidor está ONLINE!", time: new Date().toISOString() };
  }),
});
