import { z } from "zod";
import { publicProcedure, adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { providers, appEvents } from "../../drizzle/schema";
import { eq, or, ilike, and, gte, lte, ne, desc, asc, sql } from "drizzle-orm";
import { getReviewsByProfessional as getMockReviewsByProfessional } from "../../data/mock";
import { geocodeAddress } from "../geocoding";

const safeStringify = (val: any) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val;
  return JSON.stringify(val);
};

const ProviderUpsertSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  subcategoryName: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  planExpiresAt: z.string().nullable().optional(),
  services: z.any().optional(), // Can be string or array
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  avatarThumbnailUri: z.string().nullable().optional(),
  gallery: z.array(z.string()).nullable().optional(),
  address: z.string().nullable().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  coverUri: z.string().nullable().optional(),
  coverThumbnailUri: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  onlineStatus: z.boolean().optional(),
  responseTime: z.string().nullable().optional(),
  clientsServed: z.number().nullable().optional(),
  foundedYear: z.number().nullable().optional(),
  topBadge: z.string().nullable().optional(),
  popularServices: z.any().optional(),
  tags: z.any().optional(),
  workingHours: z.any().optional(),
  utmSource: z.string().nullable().optional(),
});

const ProviderUpdateSchema = z.object({
  userId: z.string(),
  updates: z.object({
    name: z.string().optional(),
    avatar: z.string().optional(),
    avatarThumbnailUri: z.string().optional(),
    category: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    services: z.any().optional(),
    plan: z.string().nullable().optional(),
    planExpiresAt: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    coverUri: z.string().nullable().optional(),
    coverThumbnailUri: z.string().nullable().optional(),
    isVerified: z.boolean().optional(),
    onlineStatus: z.boolean().optional(),
    responseTime: z.string().nullable().optional(),
    clientsServed: z.number().nullable().optional(),
    foundedYear: z.number().nullable().optional(),
    topBadge: z.string().nullable().optional(),
    popularServices: z.any().optional(),
    tags: z.any().optional(),
    workingHours: z.any().optional(),
  }),
});

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const providersRouter = router({
  list: publicProcedure
    .input(z.object({ subcategoryId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.getProviders(true);
    }),

  listLightweight: publicProcedure
    .query(async () => {
      return db.getProvidersLightweight(true);
    }),

  all: adminProcedure.query(async () => {
    return db.getProviders(false);
  }),

  upsert: protectedProcedure
    .input(ProviderUpsertSchema)
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");
      const userId = ctx.user.openId;

      // Verify if user already has a provider profile
      const existing = await dbInstance.select().from(providers).where(eq(providers.userId, userId)).limit(1);
      
      let latitude = input.latitude !== undefined && input.latitude !== null ? input.latitude : (existing.length > 0 ? existing[0].latitude : null);
      let longitude = input.longitude !== undefined && input.longitude !== null ? input.longitude : (existing.length > 0 ? existing[0].longitude : null);

      const hasAddressChanged = existing.length === 0 || 
        existing[0].address !== input.address || 
        existing[0].neighborhood !== input.neighborhood || 
        existing[0].city !== input.city;

      if (hasAddressChanged && (input.latitude === undefined || input.latitude === null)) {
        const coords = await geocodeAddress(input.address, input.neighborhood, input.city);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      if (existing.length > 0) {
        // Update
        await dbInstance.update(providers).set({
          name: input.name,
          category: input.category,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          subcategoryName: input.subcategoryName,
          serviceId: input.serviceId,
          serviceName: input.serviceName,
          city: input.city,
          neighborhood: input.neighborhood,
          phone: input.phone,
          plan: input.plan,
          planExpiresAt: input.planExpiresAt ? new Date(input.planExpiresAt) : null,
          services: JSON.stringify(input.services || []),
           description: input.description,
          avatarUri: input.avatar,
          avatarThumbnailUri: input.avatarThumbnailUri,
          gallery: input.gallery || [],
          address: input.address,
          latitude,
          longitude,
          coverUri: input.coverUri,
          coverThumbnailUri: input.coverThumbnailUri,
          isVerified: input.isVerified ?? false,
          onlineStatus: input.onlineStatus ?? false,
          responseTime: input.responseTime,
          clientsServed: input.clientsServed || 0,
          foundedYear: input.foundedYear,
          topBadge: input.topBadge,
          popularServices: safeStringify(input.popularServices),
          tags: safeStringify(input.tags),
          workingHours: safeStringify(input.workingHours),
          updatedAt: new Date(),
        }).where(eq(providers.userId, userId));
      } else {
        const providerId = uid();
        // Insert
        await dbInstance.insert(providers).values({
          id: providerId,
          userId,
          name: input.name,
          category: input.category,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          subcategoryName: input.subcategoryName,
          serviceId: input.serviceId,
          serviceName: input.serviceName,
          city: input.city,
          neighborhood: input.neighborhood,
          phone: input.phone,
          plan: input.plan,
          planExpiresAt: input.planExpiresAt ? new Date(input.planExpiresAt) : null,
          services: JSON.stringify(input.services || []),
           description: input.description,
          avatarUri: input.avatar,
          avatarThumbnailUri: input.avatarThumbnailUri,
          gallery: input.gallery || [],
          address: input.address,
          rating: input.rating || 0,
          ratingCount: input.reviewCount || 0,
          latitude,
          longitude,
          coverUri: input.coverUri || null,
          coverThumbnailUri: input.coverThumbnailUri || null,
          isVerified: input.isVerified ?? false,
          onlineStatus: input.onlineStatus ?? false,
          responseTime: input.responseTime || null,
          clientsServed: input.clientsServed || 0,
          foundedYear: input.foundedYear || null,
          topBadge: input.topBadge || null,
          popularServices: safeStringify(input.popularServices),
          tags: safeStringify(input.tags),
          workingHours: safeStringify(input.workingHours),
          isActive: true,
          displayOrder: 0,
        });

        // Log provider registration event
        await dbInstance.insert(appEvents).values({
          tipoEvento: "cadastro",
          valor: "prestador",
          cidade: input.city || null,
          prestadorId: providerId,
          usuarioId: userId,
          utmSource: input.utmSource || null,
        });
      }
      return { success: true };
    }),

  updateProvider: protectedProcedure
    .input(ProviderUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return;
      
      // Apenas o próprio usuário ou um admin pode atualizar
      if (ctx.user.openId !== input.userId && ctx.user.role !== "admin") {
        throw new Error("Forbidden: You can only update your own profile");
      }
      
      const mappedUpdates: any = {};
      if (input.updates.name !== undefined) mappedUpdates.name = input.updates.name;
       if (input.updates.avatar !== undefined) mappedUpdates.avatarUri = input.updates.avatar;
      if (input.updates.avatarThumbnailUri !== undefined) mappedUpdates.avatarThumbnailUri = input.updates.avatarThumbnailUri;
      if (input.updates.category !== undefined) mappedUpdates.category = input.updates.category;
      if (input.updates.city !== undefined) mappedUpdates.city = input.updates.city;
      if (input.updates.neighborhood !== undefined) mappedUpdates.neighborhood = input.updates.neighborhood;
      if (input.updates.phone !== undefined) mappedUpdates.phone = input.updates.phone;
      if (input.updates.description !== undefined) mappedUpdates.description = input.updates.description;
      if (input.updates.address !== undefined) mappedUpdates.address = input.updates.address;
      if (input.updates.services !== undefined) mappedUpdates.services = JSON.stringify(input.updates.services || []);
      if (input.updates.plan !== undefined) mappedUpdates.plan = input.updates.plan;
      if (input.updates.planExpiresAt !== undefined) {
        mappedUpdates.planExpiresAt = input.updates.planExpiresAt ? new Date(input.updates.planExpiresAt) : null;
      }
      if (input.updates.isActive !== undefined) mappedUpdates.isActive = input.updates.isActive;
      if (input.updates.latitude !== undefined) mappedUpdates.latitude = input.updates.latitude;
      if (input.updates.longitude !== undefined) mappedUpdates.longitude = input.updates.longitude;
      if (input.updates.coverUri !== undefined) mappedUpdates.coverUri = input.updates.coverUri;
      if (input.updates.coverThumbnailUri !== undefined) mappedUpdates.coverThumbnailUri = input.updates.coverThumbnailUri;
      if (input.updates.isVerified !== undefined) mappedUpdates.isVerified = input.updates.isVerified;
      if (input.updates.onlineStatus !== undefined) mappedUpdates.onlineStatus = input.updates.onlineStatus;
      if (input.updates.responseTime !== undefined) mappedUpdates.responseTime = input.updates.responseTime;
      if (input.updates.clientsServed !== undefined) mappedUpdates.clientsServed = input.updates.clientsServed;
      if (input.updates.foundedYear !== undefined) mappedUpdates.foundedYear = input.updates.foundedYear;
      if (input.updates.topBadge !== undefined) mappedUpdates.topBadge = input.updates.topBadge;
      if (input.updates.popularServices !== undefined) mappedUpdates.popularServices = safeStringify(input.updates.popularServices);
      if (input.updates.tags !== undefined) mappedUpdates.tags = safeStringify(input.updates.tags);
      if (input.updates.workingHours !== undefined) mappedUpdates.workingHours = safeStringify(input.updates.workingHours);
      mappedUpdates.updatedAt = new Date();

      const existing = await dbInstance.select().from(providers).where(eq(providers.userId, input.userId)).limit(1);
      if (existing.length > 0) {
        const hasAddressChanged = 
          (input.updates.address !== undefined && existing[0].address !== input.updates.address) ||
          (input.updates.neighborhood !== undefined && existing[0].neighborhood !== input.updates.neighborhood) ||
          (input.updates.city !== undefined && existing[0].city !== input.updates.city);

        if (hasAddressChanged && (input.updates.latitude === undefined || input.updates.latitude === null)) {
          const coords = await geocodeAddress(
            input.updates.address !== undefined ? input.updates.address : existing[0].address,
            input.updates.neighborhood !== undefined ? input.updates.neighborhood : existing[0].neighborhood,
            input.updates.city !== undefined ? input.updates.city : existing[0].city
          );
          if (coords) {
            mappedUpdates.latitude = coords.latitude;
            mappedUpdates.longitude = coords.longitude;
          }
        }
      }
      
      await dbInstance.update(providers).set(mappedUpdates).where(eq(providers.userId, input.userId));
      return { success: true };
    }),

  removeProvider: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return;
      
      // Apenas o próprio usuário ou um admin pode remover
      if (ctx.user.openId !== input && ctx.user.role !== "admin") {
        throw new Error("Forbidden: You can only delete your own profile");
      }
      
      await dbInstance.delete(providers).where(eq(providers.userId, input));
      return { success: true };
    }),

  getByCategory: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];
      return dbInstance.select().from(providers).where(
        or(
          eq(providers.category, input),
          eq(providers.categoryId, input),
          ilike(providers.subcategoryId, `%${input}%`),
          ilike(providers.subcategoryName, `%${input}%`),
          eq(providers.serviceId, input),
          ilike(providers.serviceName, `%${input}%`)
        )
      );
    }),

  search: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];
      const lower = `%${input.toLowerCase()}%`;
      return dbInstance.select().from(providers).where(
        or(
          ilike(providers.name, lower),
          ilike(providers.category, lower),
          ilike(providers.subcategoryName, lower),
          ilike(providers.city, lower),
          ilike(providers.neighborhood, lower),
          ilike(providers.description, lower)
        )
      );
    }),

  searchFiltered: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      profileType: z.enum(["all", "professional", "comercio"]).optional(),
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
      userLatitude: z.number().optional(),
      userLongitude: z.number().optional(),
      maxDistanceKm: z.number().optional(),
      minRating: z.number().optional(),
      onlyOnline: z.boolean().optional(),
      priceLevel: z.number().optional(),
      availability: z.enum(["any", "now", "today", "scheduled"]).optional(),
      sortBy: z.enum(["relevance", "distance", "rating", "popularity", "recent", "name"]).optional(),
    }))
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const {
        query,
        profileType,
        categoryId,
        subcategoryId,
        userLatitude,
        userLongitude,
        maxDistanceKm,
        minRating,
        onlyOnline,
        priceLevel,
        availability,
        sortBy,
      } = input;

      const conditions = [];

      // 1. Sempre filtrar prestadores ativos
      conditions.push(eq(providers.isActive, true));

      // 2. Tipo de Perfil (Comércio vs Profissional)
      if (profileType === "comercio") {
        conditions.push(eq(providers.categoryId, "comercios"));
      } else if (profileType === "professional") {
        conditions.push(ne(providers.categoryId, "comercios"));
      }

      // 3. Busca por texto
      if (query && query.trim()) {
        const lower = `%${query.trim().toLowerCase()}%`;
        conditions.push(
          or(
            ilike(providers.name, lower),
            ilike(providers.category, lower),
            ilike(providers.subcategoryName, lower),
            ilike(providers.city, lower),
            ilike(providers.neighborhood, lower),
            ilike(providers.description, lower)
          )
        );
      }

      // 4. Categoria
      if (categoryId && categoryId !== "todos") {
        conditions.push(eq(providers.categoryId, categoryId));
      }

      // 5. Subcategoria
      if (subcategoryId && subcategoryId !== "todos") {
        conditions.push(
          or(
            eq(providers.subcategoryId, subcategoryId),
            ilike(providers.subcategoryId, `%${subcategoryId}%`)
          )
        );
      }

      // 6. Avaliação Mínima
      if (minRating !== undefined && minRating > 0) {
        conditions.push(gte(providers.rating, minRating));
      }

      // 7. Apenas Online/Disponível/Disponibilidade
      if (availability === "now" || onlyOnline) {
        conditions.push(eq(providers.onlineStatus, true));
      }

      // 8. Nível de Preço
      if (priceLevel && priceLevel > 0) {
        conditions.push(eq(providers.priceLevel, priceLevel));
      }

      // 9. Bounding Box para filtro geográfico rápido utilizando índices
      const hasCoords = userLatitude !== undefined && userLongitude !== undefined;
      const limitDistance = maxDistanceKm !== undefined && maxDistanceKm > 0;
      
      if (hasCoords && limitDistance) {
        const deltaLat = maxDistanceKm / 111.0;
        const deltaLng = maxDistanceKm / (111.0 * Math.cos(userLatitude * Math.PI / 180.0));
        conditions.push(
          gte(providers.latitude, userLatitude - deltaLat),
          lte(providers.latitude, userLatitude + deltaLat),
          gte(providers.longitude, userLongitude - deltaLng),
          lte(providers.longitude, userLongitude + deltaLng)
        );
      }

      // 10. Seleção de campos leves (incluindo cálculo de distância em SQL se houver coordenadas)
      let selectFields: any = {
        id: providers.id,
        userId: providers.userId,
        name: providers.name,
        category: providers.category,
        categoryId: providers.categoryId,
        city: providers.city,
        neighborhood: providers.neighborhood,
        plan: providers.plan,
        subcategoryId: providers.subcategoryId,
        subcategoryName: providers.subcategoryName,
        avatarUri: providers.avatarUri,
        avatarThumbnailUri: providers.avatarThumbnailUri,
        rating: providers.rating,
        ratingCount: providers.ratingCount,
        latitude: providers.latitude,
        longitude: providers.longitude,
        coverUri: providers.coverUri,
        coverThumbnailUri: providers.coverThumbnailUri,
        isVerified: providers.isVerified,
        onlineStatus: providers.onlineStatus,
        responseTime: providers.responseTime,
        topBadge: providers.topBadge,
        isActive: providers.isActive,
        displayOrder: providers.displayOrder,
        destaque: providers.destaque,
        priceLevel: providers.priceLevel,
      };

      let distanceSqlExpr = sql<number>`NULL`;
      if (hasCoords) {
        distanceSqlExpr = sql<number>`6371 * acos(
          least(1.0, greatest(-1.0, 
            cos(radians(${userLatitude})) * cos(radians(${providers.latitude})) *
            cos(radians(${providers.longitude}) - radians(${userLongitude})) +
            sin(radians(${userLatitude})) * sin(radians(${providers.latitude}))
          ))
        )`;
        selectFields.distanceKm = distanceSqlExpr;
      }

      let queryBuilder = dbInstance.select(selectFields).from(providers).where(and(...conditions));

      // 11. Ordenação
      const orderByExprs = [];
      if (sortBy === "rating") {
        orderByExprs.push(desc(providers.rating), desc(providers.ratingCount));
      } else if (sortBy === "distance" && hasCoords) {
        orderByExprs.push(asc(distanceSqlExpr));
      } else if (sortBy === "popularity") {
        orderByExprs.push(desc(providers.clientsServed), desc(providers.ratingCount));
      } else if (sortBy === "recent") {
        orderByExprs.push(desc(providers.createdAt));
      } else if (sortBy === "name") {
        orderByExprs.push(asc(providers.name));
      } else {
        // relevance: Destaques/Premium primeiro, depois displayOrder/distância
        orderByExprs.push(
          desc(sql`CASE WHEN ${providers.plan} IN ('premium', 'annual') THEN 1 ELSE 0 END`),
          asc(providers.displayOrder)
        );
        if (hasCoords) {
          orderByExprs.push(asc(distanceSqlExpr));
        }
      }

      queryBuilder.orderBy(...orderByExprs);
      const results = await queryBuilder;

      return results.map(r => {
        let distanceStr = "";
        let distanceKm = (r as any).distanceKm;
        if (distanceKm !== undefined && distanceKm !== null) {
          if (distanceKm < 1) {
            distanceStr = `${Math.round(distanceKm * 1000)}m`;
          } else {
            distanceStr = `${distanceKm.toFixed(1)} km`;
          }
        }
        return {
          ...r,
          distanceKm,
          distanceStr,
        };
      });
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return null;
      const res = await dbInstance.select().from(providers).where(
        or(
          eq(providers.id, input),
          eq(providers.userId, input)
        )
      ).limit(1);
      return res.length > 0 ? res[0] : null;
    }),

  getReviews: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const dbReviews = await db.getReviewsByProfessional(input);
      let mockReviews: any[] = [];
      try {
        mockReviews = getMockReviewsByProfessional(input);
      } catch (err) {
        console.warn("[tRPC] Failed to fetch mock reviews:", err);
      }

      const formattedDb = dbReviews.map((r) => ({
        id: r.id,
        professionalId: r.professionalId,
        userName: r.userName,
        userAvatar: r.userAvatar,
        rating: r.rating,
        comment: r.comment || "",
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt),
      }));

      return [...formattedDb, ...mockReviews];
    }),

  submitReview: publicProcedure
    .input(z.object({
      providerId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      userName: z.string().optional(),
      userAvatar: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      const res = await dbInstance.select().from(providers).where(
        or(
          eq(providers.id, input.providerId),
          eq(providers.userId, input.providerId)
        )
      ).limit(1);

      if (res.length === 0) {
        throw new Error("Provider not found");
      }
      const provider = res[0];

      const oldRating = Number(provider.rating) || 0;
      const oldRatingCount = provider.ratingCount || 0;

      const newRatingCount = oldRatingCount + 1;
      const newRating = ((oldRating * oldRatingCount) + input.rating) / newRatingCount;

      await dbInstance.update(providers).set({
        rating: Number(newRating.toFixed(2)),
        ratingCount: newRatingCount,
        updatedAt: new Date(),
      }).where(eq(providers.id, provider.id));

      const reviewerName = input.userName || ctx.user?.name || "Cliente Anônimo";
      const reviewerAvatar = input.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}`;
      const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await db.createReview({
        id: reviewId,
        professionalId: provider.id,
        userName: reviewerName,
        userAvatar: reviewerAvatar,
        rating: input.rating,
        comment: input.comment || null,
        createdAt: new Date(),
      });

      return { success: true, rating: newRating, ratingCount: newRatingCount };
    }),

  // Admin routes (preserved)
  create: adminProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      // Used by admin dashboard
      const all = await db.getProviders(false);
      const maxOrder = all.length > 0 ? Math.max(...all.map((p) => p.displayOrder)) : -1;
      const id = uid();

      let latitude = input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null;
      let longitude = input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null;
      if (latitude === null || longitude === null) {
        const coords = await geocodeAddress(input.address, input.neighborhood, input.city);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      return db.createProvider({
        id,
        name: input.name,
        category: input.category || null,
        categoryId: input.categoryId || null,
        city: input.city || null,
        neighborhood: input.neighborhood || null,
        phone: input.phone || null,
        plan: input.plan || "free",
        serviceId: input.serviceId || null,
        serviceName: input.serviceName || null,
        subcategoryId: input.subcategoryId || null,
        subcategoryName: input.subcategoryName || null,
        whatsapp: input.whatsapp || null,
        description: input.description || null,
        address: input.address || null,
        avatarUri: input.avatarUri || null,
        avatarThumbnailUri: input.avatarThumbnailUri || null,
        gallery: input.gallery || null,
        rating: 0,
        ratingCount: 0,
        isActive: input.isActive ?? true,
        displayOrder: maxOrder + 1,
        destaque: input.destaque ?? false,
        latitude,
        longitude,
        coverUri: input.coverUri || null,
        coverThumbnailUri: input.coverThumbnailUri || null,
        isVerified: input.isVerified ?? false,
        onlineStatus: input.onlineStatus ?? false,
        responseTime: input.responseTime || null,
        clientsServed: input.clientsServed !== undefined ? Number(input.clientsServed) : 0,
        foundedYear: input.foundedYear !== undefined ? Number(input.foundedYear) : null,
        topBadge: input.topBadge || null,
        popularServices: safeStringify(input.popularServices),
        tags: safeStringify(input.tags),
        workingHours: safeStringify(input.workingHours),
      });
    }),

  update: adminProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const existing = await dbInstance.select().from(providers).where(eq(providers.id, id)).limit(1);
        if (existing.length > 0) {
          const hasAddressChanged = 
            (data.address !== undefined && existing[0].address !== data.address) ||
            (data.neighborhood !== undefined && existing[0].neighborhood !== data.neighborhood) ||
            (data.city !== undefined && existing[0].city !== data.city);

          if (hasAddressChanged && (data.latitude === undefined || data.latitude === null)) {
            const coords = await geocodeAddress(
              data.address !== undefined ? data.address : existing[0].address,
              data.neighborhood !== undefined ? data.neighborhood : existing[0].neighborhood,
              data.city !== undefined ? data.city : existing[0].city
            );
            if (coords) {
              data.latitude = coords.latitude;
              data.longitude = coords.longitude;
            }
          }
        }
      }
      if (data.popularServices !== undefined) data.popularServices = safeStringify(data.popularServices);
      if (data.tags !== undefined) data.tags = safeStringify(data.tags);
      if (data.workingHours !== undefined) data.workingHours = safeStringify(data.workingHours);
      if (data.clientsServed !== undefined) data.clientsServed = Number(data.clientsServed);
      if (data.foundedYear !== undefined) data.foundedYear = data.foundedYear ? Number(data.foundedYear) : null;
      
      await db.updateProvider(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteProvider(input.id);
    }),
});
