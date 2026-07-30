import { z } from "zod";
import {
  publicProcedure,
  adminProcedure,
  adminWriteProcedure,
  protectedProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";
import {
  providers,
  appEvents,
  businessPermissions,
  reviews,
  serviceViews,
  whatsappClicks,
} from "../../drizzle/schema";
import { eq, or, ilike, and, gte, lte, ne, desc, asc, sql, count } from "drizzle-orm";

import { geocodeAddress } from "../geocoding";
import { getProvidersBenefitsMap } from "../../lib/plan-benefits";

// Schema for admin provider create/update
const adminProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  plan: z.string().optional(),
  serviceId: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  subcategoryName: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  avatarUri: z.string().nullable().optional(),
  avatarThumbnailUri: z.string().nullable().optional(),
  gallery: z.array(z.string()).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  coverUri: z.string().nullable().optional(),
  coverThumbnailUri: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  destaque: z.boolean().optional(),
  onlineStatus: z.boolean().optional(),
  responseTime: z.string().nullable().optional(),
  clientsServed: z.number().optional(),
  foundedYear: z.number().nullable().optional(),
  topBadge: z.string().nullable().optional(),
  popularServices: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  workingHours: z.union([z.string(), z.any()]).nullable().optional(),
  socialLinks: z.union([z.string(), z.record(z.string(), z.string())]).nullable().optional(),
  hasCatalog: z.boolean().optional(),
});

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
  socialLinks: z.any().optional(),
  utmSource: z.string().nullable().optional(),
  hasCatalog: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.string().optional(),
  businessType: z.string().optional(),
  deliveryTime: z.string().nullable().optional(),
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
    socialLinks: z.any().optional(),
    hasCatalog: z.boolean().optional(),
    businessType: z.string().optional(),
    deliveryTime: z.string().nullable().optional(),
  }),
});

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function sanitizeProviderForUser(
  provider: any,
  currentUser: { openId: string; role: string } | null,
) {
  if (!provider) return null;
  const isAdmin = currentUser?.role === "admin";
  const isOwner = currentUser && provider.userId === currentUser.openId;

  if (isAdmin || isOwner) {
    return provider;
  }

  // Clone and mask private details
  const { userId, planExpiresAt, status, ...publicData } = provider;
  return {
    ...publicData,
    userId: null,
    planExpiresAt: null,
    status: null,
  };
}

function sanitizeProvidersForUser(
  providersList: any[],
  currentUser: { openId: string; role: string } | null,
) {
  return providersList.map((p) => sanitizeProviderForUser(p, currentUser));
}

export const providersRouter = router({
  list: publicProcedure
    .input(z.object({ subcategoryId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const results = await db.getProviders(true);
      return sanitizeProvidersForUser(results, ctx.user);
    }),

  listLightweight: publicProcedure.query(async ({ ctx }) => {
    const results = await db.getProvidersLightweight(true);
    return sanitizeProvidersForUser(results, ctx.user);
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
      const existing = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.userId, userId))
        .limit(1);

      let latitude =
        input.latitude !== undefined && input.latitude !== null
          ? input.latitude
          : existing.length > 0
            ? existing[0].latitude
            : null;
      let longitude =
        input.longitude !== undefined && input.longitude !== null
          ? input.longitude
          : existing.length > 0
            ? existing[0].longitude
            : null;

      const hasAddressChanged =
        existing.length === 0 ||
        existing[0].address !== input.address ||
        existing[0].neighborhood !== input.neighborhood ||
        existing[0].city !== input.city;

      if (
        hasAddressChanged &&
        (input.latitude === undefined || input.latitude === null)
      ) {
        const coords = await geocodeAddress(
          input.address,
          input.neighborhood,
          input.city,
        );
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      if (existing.length > 0) {
        // Update
        await dbInstance
          .update(providers)
          .set({
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
            planExpiresAt: input.planExpiresAt
              ? new Date(input.planExpiresAt)
              : null,
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
            socialLinks: safeStringify(input.socialLinks),
            businessType: input.businessType,
            deliveryTime: input.deliveryTime,
            updatedAt: new Date(),
          })
          .where(eq(providers.userId, userId));
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
          planExpiresAt: input.planExpiresAt
            ? new Date(input.planExpiresAt)
            : null,
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
          socialLinks: safeStringify(input.socialLinks),
          isActive: input.isActive ?? false,
          status: input.status ?? "pendente",
          businessType: input.businessType || "servicos",
          deliveryTime: input.deliveryTime || null,
          displayOrder: 0,
          hasCatalog: false,
        });

        // Insert default business permissions
        await dbInstance
          .insert(businessPermissions)
          .values({
            businessId: providerId,
            maxServicos: 1,
            status: "pendente",
          })
          .catch((err) => {
            console.error(
              "[providersRouter] Failed to insert default business permissions:",
              err,
            );
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
      if (input.updates.name !== undefined)
        mappedUpdates.name = input.updates.name;
      if (input.updates.avatar !== undefined)
        mappedUpdates.avatarUri = input.updates.avatar;
      if (input.updates.avatarThumbnailUri !== undefined)
        mappedUpdates.avatarThumbnailUri = input.updates.avatarThumbnailUri;
      if (input.updates.category !== undefined)
        mappedUpdates.category = input.updates.category;
      if (input.updates.city !== undefined)
        mappedUpdates.city = input.updates.city;
      if (input.updates.neighborhood !== undefined)
        mappedUpdates.neighborhood = input.updates.neighborhood;
      if (input.updates.phone !== undefined)
        mappedUpdates.phone = input.updates.phone;
      if (input.updates.description !== undefined)
        mappedUpdates.description = input.updates.description;
      if (input.updates.address !== undefined)
        mappedUpdates.address = input.updates.address;
      if (input.updates.services !== undefined)
        mappedUpdates.services = JSON.stringify(input.updates.services || []);
      if (input.updates.plan !== undefined)
        mappedUpdates.plan = input.updates.plan;
      if (input.updates.planExpiresAt !== undefined) {
        mappedUpdates.planExpiresAt = input.updates.planExpiresAt
          ? new Date(input.updates.planExpiresAt)
          : null;
      }
      if (input.updates.isActive !== undefined)
        mappedUpdates.isActive = input.updates.isActive;
      if (input.updates.latitude !== undefined)
        mappedUpdates.latitude = input.updates.latitude;
      if (input.updates.longitude !== undefined)
        mappedUpdates.longitude = input.updates.longitude;
      if (input.updates.coverUri !== undefined)
        mappedUpdates.coverUri = input.updates.coverUri;
      if (input.updates.coverThumbnailUri !== undefined)
        mappedUpdates.coverThumbnailUri = input.updates.coverThumbnailUri;
      if (input.updates.isVerified !== undefined)
        mappedUpdates.isVerified = input.updates.isVerified;
      if (input.updates.onlineStatus !== undefined)
        mappedUpdates.onlineStatus = input.updates.onlineStatus;
      if (input.updates.responseTime !== undefined)
        mappedUpdates.responseTime = input.updates.responseTime;
      if (input.updates.clientsServed !== undefined)
        mappedUpdates.clientsServed = input.updates.clientsServed;
      if (input.updates.foundedYear !== undefined)
        mappedUpdates.foundedYear = input.updates.foundedYear;
      if (input.updates.topBadge !== undefined)
        mappedUpdates.topBadge = input.updates.topBadge;
      if (input.updates.popularServices !== undefined)
        mappedUpdates.popularServices = safeStringify(
          input.updates.popularServices,
        );
      if (input.updates.tags !== undefined)
        mappedUpdates.tags = safeStringify(input.updates.tags);
      if (input.updates.workingHours !== undefined)
        mappedUpdates.workingHours = safeStringify(input.updates.workingHours);
      if (input.updates.socialLinks !== undefined)
        mappedUpdates.socialLinks = safeStringify(input.updates.socialLinks);
      if (input.updates.businessType !== undefined)
        mappedUpdates.businessType = input.updates.businessType;
      if (input.updates.deliveryTime !== undefined)
        mappedUpdates.deliveryTime = input.updates.deliveryTime;
      mappedUpdates.updatedAt = new Date();

      const existing = await dbInstance
        .select()
        .from(providers)
        .where(eq(providers.userId, input.userId))
        .limit(1);
      if (existing.length > 0) {
        const hasAddressChanged =
          (input.updates.address !== undefined &&
            existing[0].address !== input.updates.address) ||
          (input.updates.neighborhood !== undefined &&
            existing[0].neighborhood !== input.updates.neighborhood) ||
          (input.updates.city !== undefined &&
            existing[0].city !== input.updates.city);

        if (
          hasAddressChanged &&
          (input.updates.latitude === undefined ||
            input.updates.latitude === null)
        ) {
          const coords = await geocodeAddress(
            input.updates.address !== undefined
              ? input.updates.address
              : existing[0].address,
            input.updates.neighborhood !== undefined
              ? input.updates.neighborhood
              : existing[0].neighborhood,
            input.updates.city !== undefined
              ? input.updates.city
              : existing[0].city,
          );
          if (coords) {
            mappedUpdates.latitude = coords.latitude;
            mappedUpdates.longitude = coords.longitude;
          }
        }
      }

      await dbInstance
        .update(providers)
        .set(mappedUpdates)
        .where(eq(providers.userId, input.userId));
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
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];
      const results = await dbInstance
        .select()
        .from(providers)
        .where(
          or(
            eq(providers.category, input),
            eq(providers.categoryId, input),
            ilike(providers.subcategoryId, `%${input}%`),
            ilike(providers.subcategoryName, `%${input}%`),
            eq(providers.serviceId, input),
            ilike(providers.serviceName, `%${input}%`),
          ),
        );
      return sanitizeProvidersForUser(results, ctx.user);
    }),

  search: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return [];
    const lower = `%${input.toLowerCase()}%`;
    const results = await dbInstance
      .select()
      .from(providers)
      .where(
        or(
          ilike(providers.name, lower),
          ilike(providers.category, lower),
          ilike(providers.subcategoryName, lower),
          ilike(providers.city, lower),
          ilike(providers.neighborhood, lower),
          ilike(providers.description, lower),
        ),
      );
    return sanitizeProvidersForUser(results, ctx.user);
  }),

  searchFiltered: publicProcedure
    .input(
      z.object({
        // Limit query length to prevent oversized payloads
        query: z.string().max(200).optional(),
        profileType: z.enum(["all", "professional", "comercio"]).optional(),
        // Limit category/subcategory IDs to reasonable slug lengths
        categoryId: z.string().max(60).optional(),
        subcategoryId: z.string().max(60).optional(),
        // Geographic bounds: latitude -90 to 90, longitude -180 to 180
        userLatitude: z.number().min(-90).max(90).optional(),
        userLongitude: z.number().min(-180).max(180).optional(),
        // Limit max distance to 500km to prevent full-table geo scans
        maxDistanceKm: z.number().min(1).max(500).optional(),
        minRating: z.number().min(0).max(5).optional(),
        onlyOnline: z.boolean().optional(),
        priceLevel: z.number().min(1).max(4).optional(),
        availability: z.enum(["any", "now", "today", "scheduled"]).optional(),
        sortBy: z
          .enum([
            "relevance",
            "distance",
            "rating",
            "popularity",
            "recent",
            "name",
          ])
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
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
            ilike(providers.description, lower),
          ),
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
            ilike(providers.subcategoryId, `%${subcategoryId}%`),
          ),
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
      const hasCoords =
        userLatitude !== undefined && userLongitude !== undefined;
      const limitDistance = maxDistanceKm !== undefined && maxDistanceKm > 0;

      if (hasCoords && limitDistance) {
        const deltaLat = maxDistanceKm / 111.0;
        const deltaLng =
          maxDistanceKm / (111.0 * Math.cos((userLatitude * Math.PI) / 180.0));
        conditions.push(
          gte(providers.latitude, userLatitude - deltaLat),
          lte(providers.latitude, userLatitude + deltaLat),
          gte(providers.longitude, userLongitude - deltaLng),
          lte(providers.longitude, userLongitude + deltaLng),
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
        businessType: providers.businessType,
        deliveryTime: providers.deliveryTime,
        phone: providers.phone,
        whatsapp: providers.whatsapp,
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

      let queryBuilder = dbInstance
        .select(selectFields)
        .from(providers)
        .where(and(...conditions));

      // 11. Ordenação
      const orderByExprs = [];
      if (sortBy === "rating") {
        orderByExprs.push(desc(providers.rating), desc(providers.ratingCount));
      } else if (sortBy === "distance" && hasCoords) {
        orderByExprs.push(asc(distanceSqlExpr));
      } else if (sortBy === "popularity") {
        orderByExprs.push(
          desc(providers.clientsServed),
          desc(providers.ratingCount),
        );
      } else if (sortBy === "recent") {
        orderByExprs.push(desc(providers.createdAt));
      } else if (sortBy === "name") {
        orderByExprs.push(asc(providers.name));
      } else {
        // relevance: Destaques/Premium primeiro, depois displayOrder/distância
        // We'll sort post-query using benefit keys
      }

      queryBuilder.orderBy(...orderByExprs);
      const results = await queryBuilder;

      const mapped = results.map((r: any) => {
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

      // For relevance sort, reorder by featured_search benefit
      if (sortBy === "relevance" || !sortBy) {
        const providerIds = mapped.map((r) => r.id);
        const benefitsMap = await getProvidersBenefitsMap(dbInstance, providerIds);

        mapped.sort((a, b) => {
          const aFeatured = benefitsMap.get(a.id)?.has("featured_search") ? 1 : 0;
          const bFeatured = benefitsMap.get(b.id)?.has("featured_search") ? 1 : 0;
          if (bFeatured !== aFeatured) return bFeatured - aFeatured;

          // Secondary sort by displayOrder
          if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;

          // Tertiary sort by distance if available
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return a.distanceKm - b.distanceKm;
          }

          return 0;
        });
      }

      return sanitizeProvidersForUser(mapped, ctx.user);
    }),

  smartSearch: publicProcedure
    .input(
      z.object({
        // Limit query length to prevent oversized payloads
        query: z.string().min(1).max(200),
      }),
    )
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return { success: false, reason: "DB_UNAVAILABLE" };

      const rawQuery = input.query.trim().toLowerCase();
      if (!rawQuery) return { success: false, reason: "EMPTY_QUERY" };

      const allCats = await db.getAllCategories();
      const allSubs = await db.getAllSubServices();

      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .trim();

      const queryNorm = normalize(rawQuery);

      const keywordMap: Record<
        string,
        { categoryId?: string; label: string; scoreMultiplier?: number }
      > = {
        eletricista: {
          categoryId: "reformas-reparos",
          label: "Eletricista",
          scoreMultiplier: 2.0,
        },
        eletrica: { categoryId: "reformas-reparos", label: "Eletricista" },
        fiação: { categoryId: "reformas-reparos", label: "Eletricista" },
        fiacao: { categoryId: "reformas-reparos", label: "Eletricista" },
        chuveiro: { categoryId: "reformas-reparos", label: "Eletricista" },
        tomada: { categoryId: "reformas-reparos", label: "Eletricista" },
        lampada: { categoryId: "reformas-reparos", label: "Eletricista" },
        curto: { categoryId: "reformas-reparos", label: "Eletricista" },
        disjuntor: { categoryId: "reformas-reparos", label: "Eletricista" },
        ventilador: { categoryId: "reformas-reparos", label: "Eletricista" },

        encanador: {
          categoryId: "reformas-reparos",
          label: "Encanador",
          scoreMultiplier: 2.0,
        },
        encanamento: { categoryId: "reformas-reparos", label: "Encanador" },
        cano: { categoryId: "reformas-reparos", label: "Encanador" },
        vazamento: { categoryId: "reformas-reparos", label: "Encanador" },
        infiltracao: { categoryId: "reformas-reparos", label: "Encanador" },
        torneira: { categoryId: "reformas-reparos", label: "Encanador" },
        pia: { categoryId: "reformas-reparos", label: "Encanador" },
        desentupir: { categoryId: "reformas-reparos", label: "Encanador" },
        esgoto: { categoryId: "reformas-reparos", label: "Encanador" },

        pintor: {
          categoryId: "reformas-reparos",
          label: "Pintor",
          scoreMultiplier: 2.0,
        },
        pintura: { categoryId: "reformas-reparos", label: "Pintor" },
        pintar: { categoryId: "reformas-reparos", label: "Pintor" },
        "massa corrida": { categoryId: "reformas-reparos", label: "Pintor" },
        verniz: { categoryId: "reformas-reparos", label: "Pintor" },
        portao: { categoryId: "reformas-reparos", label: "Pintor" },
        parede: { categoryId: "reformas-reparos", label: "Pintor" },

        pedreiro: {
          categoryId: "reformas-reparos",
          label: "Pedreiro",
          scoreMultiplier: 2.0,
        },
        reforma: { categoryId: "reformas-reparos", label: "Pedreiro" },
        construir: { categoryId: "reformas-reparos", label: "Pedreiro" },
        tijolo: { categoryId: "reformas-reparos", label: "Pedreiro" },
        cimento: { categoryId: "reformas-reparos", label: "Pedreiro" },
        azulejo: { categoryId: "reformas-reparos", label: "Pedreiro" },
        piso: { categoryId: "reformas-reparos", label: "Pedreiro" },
        reboco: { categoryId: "reformas-reparos", label: "Pedreiro" },

        marceneiro: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        marcenaria: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        moveis: { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
        armario: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        "guarda-roupa": {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        madeira: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        montagem: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },
        montar: { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
        desmontar: {
          categoryId: "reformas-reparos",
          label: "Montagem de Móveis",
        },

        chaveiro: {
          categoryId: "reformas-reparos",
          label: "Chaveiro",
          scoreMultiplier: 2.0,
        },
        chave: { categoryId: "reformas-reparos", label: "Chaveiro" },
        fechadura: { categoryId: "reformas-reparos", label: "Chaveiro" },
        cadeado: { categoryId: "reformas-reparos", label: "Chaveiro" },
        "abrir porta": { categoryId: "reformas-reparos", label: "Chaveiro" },

        diarista: {
          categoryId: "servicos-domesticos",
          label: "Diarista",
          scoreMultiplier: 2.0,
        },
        faxina: { categoryId: "servicos-domesticos", label: "Faxineira" },
        faxineira: { categoryId: "servicos-domesticos", label: "Faxineira" },
        limpeza: { categoryId: "servicos-domesticos", label: "Diarista" },
        passadeira: { categoryId: "servicos-domesticos", label: "Passadeira" },
        "passar roupa": {
          categoryId: "servicos-domesticos",
          label: "Passadeira",
        },
        baba: { categoryId: "servicos-domesticos", label: "Babá" },
        crianca: { categoryId: "servicos-domesticos", label: "Babá" },

        jardineiro: {
          categoryId: "servicos-externos",
          label: "Jardinagem",
          scoreMultiplier: 2.0,
        },
        jardim: { categoryId: "servicos-externos", label: "Jardinagem" },
        grama: { categoryId: "servicos-externos", label: "Jardinagem" },
        podar: { categoryId: "servicos-externos", label: "Jardinagem" },
        plantas: { categoryId: "servicos-externos", label: "Jardinagem" },

        piscineiro: { categoryId: "servicos-externos", label: "Piscineiro" },
        piscina: { categoryId: "servicos-externos", label: "Piscineiro" },
        "limpar piscina": {
          categoryId: "servicos-externos",
          label: "Piscineiro",
        },

        tecnico: {
          categoryId: "assistencia-tecnica",
          label: "Assistência Técnica",
        },
        conserto: {
          categoryId: "assistencia-tecnica",
          label: "Assistência Técnica",
        },
        celular: {
          categoryId: "assistencia-tecnica",
          label: "Conserto de Celular",
        },
        "tela quebrada": {
          categoryId: "assistencia-tecnica",
          label: "Conserto de Celular",
        },
        notebook: {
          categoryId: "assistencia-tecnica",
          label: "Técnico de Notebook",
        },
        computador: {
          categoryId: "assistencia-tecnica",
          label: "Técnico de Notebook",
        },
        "ar-condicionado": {
          categoryId: "assistencia-tecnica",
          label: "Ar-condicionado",
        },
        "ar condicionado": {
          categoryId: "assistencia-tecnica",
          label: "Ar-condicionado",
        },
        geladeira: {
          categoryId: "assistencia-tecnica",
          label: "Conserto de Geladeira",
        },
        "maquina de lavar": {
          categoryId: "assistencia-tecnica",
          label: "Conserto de Máquina",
        },

        mecanico: { categoryId: "automotivo", label: "Mecânico" },
        oficina: { categoryId: "automotivo", label: "Mecânico" },
        carro: { categoryId: "automotivo", label: "Mecânico" },
        pneu: { categoryId: "automotivo", label: "Mecânico" },
        motor: { categoryId: "automotivo", label: "Mecânico" },
        freio: { categoryId: "automotivo", label: "Mecânico" },
        "lava rapido": { categoryId: "automotivo", label: "Lava Rápido" },
        "lavar carro": { categoryId: "automotivo", label: "Lava Rápido" },

        barbeiro: { categoryId: "beleza-estetica", label: "Barbeiro" },
        barba: { categoryId: "beleza-estetica", label: "Barbeiro" },
        cabelo: { categoryId: "beleza-estetica", label: "Barbeiro" },
        cabeleireiro: { categoryId: "beleza-estetica", label: "Barbeiro" },
        manicure: { categoryId: "beleza-estetica", label: "Manicure" },
        unha: { categoryId: "beleza-estetica", label: "Manicure" },
        sobrancelha: { categoryId: "beleza-estetica", label: "Sobrancelhas" },
        cilios: { categoryId: "beleza-estetica", label: "Sobrancelhas" },
      };

      const matchScores: Record<
        string,
        {
          type: "category" | "subcategory";
          id: string;
          name: string;
          score: number;
        }
      > = {};
      const words = queryNorm.split(/\s+/).filter((w) => w.length > 2);

      for (const [kw, mapInfo] of Object.entries(keywordMap)) {
        const kwNorm = normalize(kw);
        if (queryNorm.includes(kwNorm)) {
          const multiplier = mapInfo.scoreMultiplier || 1.0;
          const points = 10 * multiplier;

          if (mapInfo.categoryId) {
            const matchedSub = allSubs.find(
              (s) =>
                normalize(s.name).includes(normalize(mapInfo.label)) &&
                s.categoryId === mapInfo.categoryId,
            );
            if (matchedSub) {
              const key = `sub-${matchedSub.id}`;
              matchScores[key] = {
                type: "subcategory",
                id: matchedSub.id,
                name: matchedSub.name,
                score: (matchScores[key]?.score || 0) + points,
              };
            } else {
              const key = `cat-${mapInfo.categoryId}`;
              matchScores[key] = {
                type: "category",
                id: mapInfo.categoryId,
                name:
                  allCats.find((c) => c.id === mapInfo.categoryId)?.name ||
                  mapInfo.categoryId,
                score: (matchScores[key]?.score || 0) + points,
              };
            }
          }
        }
      }

      allCats.forEach((c) => {
        const catNorm = normalize(c.name);
        let score = 0;

        if (queryNorm === catNorm) score += 50;
        else if (queryNorm.includes(catNorm)) score += 30;
        else {
          words.forEach((w) => {
            if (catNorm.includes(w)) score += 5;
          });
        }

        if (score > 0) {
          const key = `cat-${c.id}`;
          matchScores[key] = {
            type: "category",
            id: c.id,
            name: c.name,
            score: (matchScores[key]?.score || 0) + score,
          };
        }
      });

      allSubs.forEach((s) => {
        const subNorm = normalize(s.name);
        let score = 0;

        if (queryNorm === subNorm) score += 50;
        else if (queryNorm.includes(subNorm)) score += 40;
        else {
          words.forEach((w) => {
            if (subNorm.includes(w)) score += 8;
          });
        }

        if (score > 0) {
          const key = `sub-${s.id}`;
          matchScores[key] = {
            type: "subcategory",
            id: s.id,
            name: s.name,
            score: (matchScores[key]?.score || 0) + score,
          };
        }
      });

      let bestMatch: {
        type: "category" | "subcategory";
        id: string;
        name: string;
        score: number;
      } | null = null;
      for (const item of Object.values(matchScores)) {
        if (!bestMatch || item.score > bestMatch.score) {
          bestMatch = item;
        }
      }

      const THRESHOLD = 8;
      if (bestMatch && bestMatch.score >= THRESHOLD) {
        let finalCatId: string | undefined;
        let finalSubId: string | undefined;

        if (bestMatch.type === "category") {
          finalCatId = bestMatch.id;
        } else {
          finalSubId = bestMatch.id;
          const subObj = allSubs.find((s) => s.id === bestMatch!.id);
          finalCatId = subObj?.categoryId;
        }

        return {
          success: true,
          type: bestMatch.type,
          id: bestMatch.id,
          name: bestMatch.name,
          categoryId: finalCatId,
          subcategoryId: finalSubId,
          score: bestMatch.score,
        };
      }

      return {
        success: false,
        reason: "LOW_CONFIDENCE",
        suggestedCategories: allCats
          .slice(0, 5)
          .map((c) => ({ id: c.id, name: c.name })),
      };
    }),

  getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return null;

    const res = await dbInstance
      .select({
        provider: providers,
        permissions: businessPermissions,
      })
      .from(providers)
      .leftJoin(
        businessPermissions,
        eq(businessPermissions.businessId, providers.id),
      )
      .where(or(eq(providers.id, input), eq(providers.userId, input)))
      .limit(1);

    if (res.length === 0) return null;

    const providerData = {
      ...res[0].provider,
      maxServicos: res[0].permissions?.maxServicos ?? 1,
      permissionsStatus: res[0].permissions?.status ?? "ativo",
    };

    return sanitizeProviderForUser(providerData, ctx.user);
  }),

  getReviews: publicProcedure.input(z.string()).query(async ({ input }) => {
    const dbReviews = await db.getReviewsByProfessional(input);

    return dbReviews.map((r) => ({
      id: r.id,
      professionalId: r.professionalId,
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment || "",
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString().split("T")[0]
          : String(r.createdAt),
    }));
  }),

  submitReview: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      const res = await dbInstance
        .select()
        .from(providers)
        .where(
          or(
            eq(providers.id, input.providerId),
            eq(providers.userId, input.providerId),
          ),
        )
        .limit(1);

      if (res.length === 0) {
        throw new Error("Provider not found");
      }
      const provider = res[0];

      const oldRating = Number(provider.rating) || 0;
      const oldRatingCount = provider.ratingCount || 0;

      const newRatingCount = oldRatingCount + 1;
      const newRating =
        (oldRating * oldRatingCount + input.rating) / newRatingCount;

      await dbInstance
        .update(providers)
        .set({
          rating: Number(newRating.toFixed(2)),
          ratingCount: newRatingCount,
          updatedAt: new Date(),
        })
        .where(eq(providers.id, provider.id));

      const reviewerName = ctx.user.name || "Cliente XamaJá";
      const reviewerAvatar =
        ctx.user.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=25D366&color=000`;
      const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await db.createReview({
        id: reviewId,
        professionalId: provider.id,
        userName: reviewerName,
        userAvatar: reviewerAvatar,
        rating: input.rating,
        comment: input.comment || null,
        userId: ctx.user.openId,
        createdAt: new Date(),
      });

      return { success: true, rating: newRating, ratingCount: newRatingCount };
    }),

  getUserReviews: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not found");

    const dbReviews = await dbInstance
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        providerId: providers.id,
        providerName: providers.name,
        providerCategory: providers.category,
      })
      .from(reviews)
      .innerJoin(providers, eq(reviews.professionalId, providers.id))
      .where(eq(reviews.userId, ctx.user.openId))
      .orderBy(desc(reviews.createdAt));

    return dbReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || "",
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt),
      provider: {
        id: r.providerId,
        name: r.providerName,
        category: r.providerCategory || "",
      },
    }));
  }),

  getProviderStats: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      // Verify ownership
      const provs = await dbInstance
        .select()
        .from(providers)
        .where(
          and(
            eq(providers.id, input.providerId),
            eq(providers.userId, ctx.user.openId),
          ),
        )
        .limit(1);

      if (provs.length === 0) {
        throw new Error("Provider not found or access denied");
      }

      // Count visualizações
      const [viewsCount] = await dbInstance
        .select({ value: count() })
        .from(serviceViews)
        .where(eq(serviceViews.serviceId, input.providerId));

      // Count clicks
      const [whatsappCount] = await dbInstance
        .select({ value: count() })
        .from(whatsappClicks)
        .where(eq(whatsappClicks.providerId, input.providerId));

      return {
        views: viewsCount?.value || 0,
        whatsappClicks: whatsappCount?.value || 0,
      };
    }),

  // Admin routes (preserved)
  create: adminWriteProcedure.input(adminProviderSchema).mutation(async ({ input }) => {
    // Used by admin dashboard
    const all = await db.getProviders(false);
    const maxOrder =
      all.length > 0 ? Math.max(...all.map((p) => p.displayOrder)) : -1;
    const id = uid();

    let latitude =
      input.latitude !== undefined && input.latitude !== null
        ? Number(input.latitude)
        : null;
    let longitude =
      input.longitude !== undefined && input.longitude !== null
        ? Number(input.longitude)
        : null;
    if (latitude === null || longitude === null) {
      const coords = await geocodeAddress(
        input.address,
        input.neighborhood,
        input.city,
      );
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
      clientsServed:
        input.clientsServed !== undefined ? Number(input.clientsServed) : 0,
      foundedYear:
        input.foundedYear !== undefined ? Number(input.foundedYear) : null,
      topBadge: input.topBadge || null,
      popularServices: safeStringify(input.popularServices),
      tags: safeStringify(input.tags),
      workingHours: safeStringify(input.workingHours),
      socialLinks: safeStringify(input.socialLinks),
      hasCatalog: input.hasCatalog ?? false,
    });
  }),

  update: adminWriteProcedure.input(adminProviderSchema.extend({ id: z.string() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const dbInstance = await db.getDb();
    if (dbInstance) {
      try {
        const existing = await dbInstance
          .select()
          .from(providers)
          .where(eq(providers.id, id))
          .limit(1);
        if (existing.length > 0) {
          const hasAddressChanged =
            (data.address !== undefined &&
              existing[0].address !== data.address) ||
            (data.neighborhood !== undefined &&
              existing[0].neighborhood !== data.neighborhood) ||
            (data.city !== undefined && existing[0].city !== data.city);

          if (
            hasAddressChanged &&
            (data.latitude === undefined || data.latitude === null)
          ) {
            const coords = await geocodeAddress(
              data.address !== undefined ? data.address : existing[0].address,
              data.neighborhood !== undefined
                ? data.neighborhood
                : existing[0].neighborhood,
              data.city !== undefined ? data.city : existing[0].city,
            );
            if (coords) {
              data.latitude = coords.latitude;
              data.longitude = coords.longitude;
            }
          }
        }
      } catch (selectErr: any) {
        console.error("SELECT ERROR in update:", selectErr);
        throw new Error(`Select query failed: ${selectErr.message || selectErr}`);
      }
    }
    if (data.popularServices !== undefined)
      data.popularServices = safeStringify(data.popularServices);
    if (data.tags !== undefined) data.tags = safeStringify(data.tags);
    if (data.workingHours !== undefined)
      data.workingHours = safeStringify(data.workingHours);
    if (data.socialLinks !== undefined)
      data.socialLinks = safeStringify(data.socialLinks);
    if (data.clientsServed !== undefined)
      data.clientsServed = Number(data.clientsServed);
    if (data.foundedYear !== undefined)
      data.foundedYear = data.foundedYear ? Number(data.foundedYear) : null;

    try {
      await db.updateProvider(id, data as any);
    } catch (updateErr: any) {
      console.error("UPDATE ERROR in update:", updateErr);
      throw new Error(`Update query failed: ${updateErr.message || updateErr}`);
    }
  }),

  delete: adminWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteProvider(input.id);
    }),

  updatePermissions: adminProcedure
    .input(
      z.object({
        businessId: z.string(),
        maxServicos: z.number().int().min(-1),
        status: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      const existing = await dbInstance
        .select()
        .from(businessPermissions)
        .where(eq(businessPermissions.businessId, input.businessId))
        .limit(1);

      if (existing.length > 0) {
        await dbInstance
          .update(businessPermissions)
          .set({
            maxServicos: input.maxServicos,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(businessPermissions.businessId, input.businessId));
      } else {
        await dbInstance.insert(businessPermissions).values({
          businessId: input.businessId,
          maxServicos: input.maxServicos,
          status: input.status,
        });
      }
      return { success: true };
    }),

  // ── Ownership Transfer ──────────────────────────────────────────────────────

  /**
   * Search users by email, phone, openId or name.
   * Admin-only: used to pick a new owner for a provider profile.
   */
  searchUsersForTransfer: adminProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      const results = await db.searchUsersForTransfer(input.query);
      return results;
    }),

  /**
   * Transfer (or revoke) ownership of a provider profile.
   * Pass newUserId = null to remove the current owner.
   * Pass emailInvite to invite a non-existing user via email.
   */
  transferOwnership: adminWriteProcedure
    .input(
      z.object({
        providerId: z.string().min(1),
        newUserId: z.string().nullable(),
        emailInvite: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      // Verify provider exists
      const providerRows = await dbInstance
        .select({ id: providers.id, name: providers.name, userId: providers.userId })
        .from(providers)
        .where(eq(providers.id, input.providerId))
        .limit(1);

      if (providerRows.length === 0) {
        throw new Error("Provider não encontrado.");
      }

      const provider = providerRows[0];
      const previousUserId = provider.userId;

      // Perform the transfer
      await db.transferProviderOwnership(input.providerId, input.newUserId, input.emailInvite);

      // Log the action in admin_activity_logs via supabase (best-effort)
      const actionDetail = input.newUserId
        ? `Propriedade de "${provider.name}" (ID: ${input.providerId}) transferida de "${previousUserId ?? "nenhum"}" para "${input.newUserId}".`
        : input.emailInvite
          ? `Convite de propriedade para "${provider.name}" enviado para o email "${input.emailInvite}".`
          : `Propriedade de "${provider.name}" (ID: ${input.providerId}) removida (anterior: "${previousUserId ?? "nenhum"}").`;

      console.info(`[transferOwnership] admin=${ctx.user.openId} — ${actionDetail}`);

      return { success: true };
    }),
});
