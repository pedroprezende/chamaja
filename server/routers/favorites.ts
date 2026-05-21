import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { favorites } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const favoritesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId;
    const dbFavorites = await db.getFavoritesByUser(userId);
    
    // Map to FavoriteProfessional format expected by the frontend
    return dbFavorites.map((pro) => ({
      id: pro.id,
      name: pro.name,
      category: pro.category || "",
      city: pro.city || "",
      avatar: pro.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}`,
      rating: Number(pro.rating) || 0,
      phone: pro.phone || pro.whatsapp || "",
      type: ((pro.plan?.toLowerCase() === "premium" || pro.plan?.toLowerCase() === "annual" || pro.plan?.toLowerCase() === "monthly") ? "premium" : "free") as "free" | "premium",
    }));
  }),

  toggle: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.openId;
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      const existing = await dbInstance
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.providerId, input.providerId)))
        .limit(1);

      if (existing.length > 0) {
        await db.removeFavorite(userId, input.providerId);
        return { isFavorite: false };
      } else {
        await db.addFavorite(userId, input.providerId);
        return { isFavorite: true };
      }
    }),
});
