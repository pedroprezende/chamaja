import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const featuredAdsRouter = router({
  list: publicProcedure.query(async () => {
    const rawAds = await db.getFeaturedAds();
    
    // Seed se estiver vazio
    if (rawAds.length === 0) {
      console.log("[FeaturedAds] Database empty, seeding...");
      const MOCK_DATA = [
        { title: "Reformas", name: "João Pedreiro", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80", desc: "Especialista em alvenaria e acabamentos." },
        { title: "Elétrica", name: "Silva Elétrica", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", desc: "Instalações e reparos elétricos com segurança." },
        { title: "Limpeza", name: "Maria Faxinas", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", desc: "Limpeza residencial e comercial detalhada." }
      ];

      await Promise.all(MOCK_DATA.map((m, idx) => 
        db.createFeaturedAd({
          id: `seed-${idx}-${Date.now()}`,
          title: m.title,
          providerName: m.name,
          imageUrl: m.img,
          description: JSON.stringify({ providerId: `seed-${idx}`, description: m.desc }),
          isFeatured: true,
          displayOrder: idx
        }).catch(() => {})
      ));
      return db.getFeaturedAds();
    }

    return rawAds.map(ad => {
      let providerId = ad.description;
      let customDescription = "";
      
      try {
        if (ad.description?.startsWith("{")) {
          const parsed = JSON.parse(ad.description);
          providerId = parsed.providerId;
          customDescription = parsed.description;
        }
      } catch (e) {
        // Fallback para caso não seja JSON
      }

      return {
        ...ad,
        providerId,
        description: customDescription,
      };
    });
  }),

  create: adminProcedure
    .input(z.object({
      providerId: z.string(),
      providerName: z.string(),
      providerAvatar: z.string().nullish(),
      categoryName: z.string().nullish(),
      customDescription: z.string().default(""),
      isFeatured: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const all = await db.getFeaturedAds();
      const maxOrder = all.length > 0 ? Math.max(...all.map(a => a.displayOrder)) : -1;
      
      const combinedDescription = JSON.stringify({
        providerId: input.providerId,
        description: input.customDescription
      });

      return db.createFeaturedAd({
        id: uid(),
        title: input.categoryName || "Destaque",
        providerName: input.providerName || "Prestador",
        imageUrl: input.providerAvatar || null,
        description: combinedDescription,
        isFeatured: input.isFeatured,
        displayOrder: maxOrder + 1,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteFeaturedAd(input.id);
      return { success: true };
    }),

  toggle: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const ads = await db.getFeaturedAds();
      const ad = ads.find(a => a.id === input.id);
      if (!ad) throw new Error("Ad not found");
      
      await db.updateFeaturedAd(input.id, { isFeatured: !ad.isFeatured });
      return { success: true, isFeatured: !ad.isFeatured };
    }),
});
