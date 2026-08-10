import { z } from "zod";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";
import {
  needs,
  needApplications,
  users,
  providers,
  categories,
} from "../../drizzle/schema";
import { eq, and, or, ilike, desc, asc, sql, count, inArray, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { geocodeAddress } from "../geocoding";

const uid = (prefix = "need") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ── Validation Schemas ────────────────────────────────────────────────────────
const createNeedSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(255),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  subcategoryName: z.string().nullable().optional(),
  requiredProfessionals: z.number().int().min(1).default(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)").nullable().optional(),
  startTime: z.string().nullable().optional(), // HH:MM
  endTime: z.string().nullable().optional(), // HH:MM
  budget: z.number().positive().nullable().optional(),
  paymentType: z.enum(["total", "diaria", "hora", "a_combinar"]).default("total"),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  requirements: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.array(z.string()).nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const updateNeedSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  subcategoryName: z.string().nullable().optional(),
  requiredProfessionals: z.number().int().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  paymentType: z.enum(["total", "diaria", "hora", "a_combinar"]).optional(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  requirements: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.array(z.string()).nullable().optional(),
  status: z.enum(["ativa", "pausada", "encerrada", "cancelada"]).optional(),
  expiresAt: z.string().nullable().optional(),
});

// ── Router ───────────────────────────────────────────────────────────────────
export const needsRouter = router({
  /**
   * 1. Criar uma nova necessidade (Demanda de serviço)
   */
  create: protectedProcedure
    .input(createNeedSchema)
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const needId = uid("need");
      const userId = ctx.user.openId;

      // Geocodificação automática caso latitude/longitude não tenham sido informadas
      let latitude = input.latitude ?? null;
      let longitude = input.longitude ?? null;

      if ((latitude === null || longitude === null) && (input.address || input.city)) {
        try {
          const coords = await geocodeAddress(
            input.address || "",
            input.neighborhood || "",
            input.city,
            undefined,
            true,
          );
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          }
        } catch (geoErr) {
          console.warn("[needsRouter.create] Falha na geocodificação:", geoErr);
        }
      }

      await dbInstance.insert(needs).values({
        id: needId,
        userId,
        title: input.title,
        description: input.description,
        category: input.category || null,
        categoryId: input.categoryId || null,
        subcategoryId: input.subcategoryId || null,
        subcategoryName: input.subcategoryName || null,
        requiredProfessionals: input.requiredProfessionals,
        filledSpots: 0,
        startDate: input.startDate,
        endDate: input.endDate || null,
        startTime: input.startTime || null,
        endTime: input.endTime || null,
        budget: input.budget || null,
        paymentType: input.paymentType,
        address: input.address || null,
        neighborhood: input.neighborhood || null,
        city: input.city,
        latitude,
        longitude,
        requirements: input.requirements || null,
        notes: input.notes || null,
        photos: input.photos || [],
        status: "ativa",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });

      return { success: true, id: needId };
    }),

  /**
   * 2. Atualizar/Editar uma necessidade existente
   */
  update: protectedProcedure
    .input(updateNeedSchema)
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const existing = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade não encontrada",
        });
      }

      const need = existing[0];
      const isOwner = need.userId === ctx.user.openId;
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta publicação.",
        });
      }

      // Preparar payload de update
      const updates: Partial<typeof needs.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.category !== undefined) updates.category = input.category;
      if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
      if (input.subcategoryId !== undefined) updates.subcategoryId = input.subcategoryId;
      if (input.subcategoryName !== undefined) updates.subcategoryName = input.subcategoryName;
      if (input.requiredProfessionals !== undefined) updates.requiredProfessionals = input.requiredProfessionals;
      if (input.startDate !== undefined) updates.startDate = input.startDate;
      if (input.endDate !== undefined) updates.endDate = input.endDate;
      if (input.startTime !== undefined) updates.startTime = input.startTime;
      if (input.endTime !== undefined) updates.endTime = input.endTime;
      if (input.budget !== undefined) updates.budget = input.budget;
      if (input.paymentType !== undefined) updates.paymentType = input.paymentType;
      if (input.address !== undefined) updates.address = input.address;
      if (input.neighborhood !== undefined) updates.neighborhood = input.neighborhood;
      if (input.city !== undefined) updates.city = input.city;
      if (input.latitude !== undefined) updates.latitude = input.latitude;
      if (input.longitude !== undefined) updates.longitude = input.longitude;
      if (input.requirements !== undefined) updates.requirements = input.requirements;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.photos !== undefined) updates.photos = input.photos;
      if (input.status !== undefined) updates.status = input.status;
      if (input.expiresAt !== undefined) {
        updates.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      }

      await dbInstance.update(needs).set(updates).where(eq(needs.id, input.id));

      return { success: true };
    }),

  /**
   * 3. Cancelar uma necessidade
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const existing = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade não encontrada",
        });
      }

      const need = existing[0];
      const isOwner = need.userId === ctx.user.openId;
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para cancelar esta publicação.",
        });
      }

      await dbInstance
        .update(needs)
        .set({ status: "cancelada", updatedAt: new Date() })
        .where(eq(needs.id, input.id));

      return { success: true };
    }),

  /**
   * 4. Buscar / Listar necessidades com filtros flexíveis
   */
  list: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
        city: z.string().optional(),
        status: z.enum(["ativa", "pausada", "encerrada", "cancelada", "todas"]).optional().default("ativa"),
        search: z.string().optional(),
        dateFilter: z.string().optional(), // 'today', 'tomorrow', 'week', 'all' ou YYYY-MM-DD
        timeFilter: z.enum(["qualquer", "manha", "tarde", "noite"]).optional(),
        minBudget: z.number().optional(),
        maxBudget: z.number().optional(),
        paymentType: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        maxDistanceKm: z.number().optional(),
        sortBy: z.enum(["recent", "budget_desc", "budget_asc", "distance", "date_asc"]).optional().default("recent"),
        creatorUserId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return { items: [], total: 0 };

      const conditions = [];

      if (input.status !== "todas") {
        conditions.push(eq(needs.status, input.status));
      }

      if (input.categoryId && input.categoryId !== "todos") {
        conditions.push(
          or(
            eq(needs.categoryId, input.categoryId),
            ilike(needs.category, `%${input.categoryId}%`)
          )!
        );
      }

      if (input.subcategoryId && input.subcategoryId !== "todos") {
        conditions.push(
          or(
            eq(needs.subcategoryId, input.subcategoryId),
            ilike(needs.subcategoryName, `%${input.subcategoryId}%`)
          )!
        );
      }

      if (input.city && input.city.trim() && input.city !== "Todas") {
        conditions.push(ilike(needs.city, `%${input.city.trim()}%`));
      }

      if (input.paymentType && input.paymentType !== "todos") {
        conditions.push(eq(needs.paymentType, input.paymentType));
      }

      if (input.minBudget !== undefined && input.minBudget > 0) {
        conditions.push(sql`${needs.budget} >= ${input.minBudget}`);
      }

      if (input.maxBudget !== undefined && input.maxBudget > 0) {
        conditions.push(sql`${needs.budget} <= ${input.maxBudget}`);
      }

      // Filtro de horário / turno
      if (input.timeFilter && input.timeFilter !== "qualquer") {
        if (input.timeFilter === "manha") {
          conditions.push(sql`(${needs.startTime} IS NULL OR ${needs.startTime} < '12:00')`);
        } else if (input.timeFilter === "tarde") {
          conditions.push(sql`(${needs.startTime} >= '12:00' AND ${needs.startTime} < '18:00')`);
        } else if (input.timeFilter === "noite") {
          conditions.push(sql`(${needs.startTime} >= '18:00' OR ${needs.endTime} >= '18:00')`);
        }
      }

      // Filtro por data
      if (input.dateFilter && input.dateFilter !== "all" && input.dateFilter !== "todos") {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (input.dateFilter === "today") {
          conditions.push(eq(needs.startDate, todayStr));
        } else if (input.dateFilter === "tomorrow") {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tY = tomorrow.getFullYear();
          const tM = String(tomorrow.getMonth() + 1).padStart(2, "0");
          const tD = String(tomorrow.getDate()).padStart(2, "0");
          conditions.push(eq(needs.startDate, `${tY}-${tM}-${tD}`));
        } else if (input.dateFilter === "week") {
          const weekLater = new Date(today);
          weekLater.setDate(weekLater.getDate() + 7);
          const wY = weekLater.getFullYear();
          const wM = String(weekLater.getMonth() + 1).padStart(2, "0");
          const wD = String(weekLater.getDate()).padStart(2, "0");
          const weekStr = `${wY}-${wM}-${wD}`;
          conditions.push(sql`${needs.startDate} >= ${todayStr} AND ${needs.startDate} <= ${weekStr}`);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(input.dateFilter)) {
          conditions.push(eq(needs.startDate, input.dateFilter));
        }
      }

      if (input.creatorUserId) {
        conditions.push(eq(needs.userId, input.creatorUserId));
      }

      if (input.search && input.search.trim()) {
        const searchTerm = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(needs.title, searchTerm),
            ilike(needs.description, searchTerm),
            ilike(needs.city, searchTerm),
            ilike(needs.neighborhood, searchTerm),
            ilike(needs.category, searchTerm),
            ilike(needs.subcategoryName, searchTerm),
            ilike(needs.requirements, searchTerm),
          )!,
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Ordenação
      let orderExpr: any = desc(needs.createdAt);
      if (input.sortBy === "budget_desc") {
        orderExpr = desc(needs.budget);
      } else if (input.sortBy === "budget_asc") {
        orderExpr = asc(needs.budget);
      } else if (input.sortBy === "date_asc") {
        orderExpr = asc(needs.startDate);
      }

      // Consulta de itens com dados do criador e contagem de candidaturas
      const results = await dbInstance
        .select({
          need: needs,
          creator: {
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
          applicationsCount: sql<number>`cast(count(${needApplications.id}) as integer)`,
        })
        .from(needs)
        .leftJoin(users, eq(needs.userId, users.openId))
        .leftJoin(needApplications, eq(needs.id, needApplications.needId))
        .where(whereClause)
        .groupBy(needs.id, users.name, users.avatarUrl)
        .orderBy(orderExpr)
        .limit(input.limit)
        .offset(input.offset);

      const hasUserCoords =
        input.latitude !== undefined &&
        input.longitude !== undefined &&
        !isNaN(input.latitude) &&
        !isNaN(input.longitude);

      // Função auxiliar para cálculo de distância Haversine
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Raio da Terra em km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let items = results.map((r) => {
        let distanceKm: number | null = null;
        let distanceStr: string | null = null;

        if (hasUserCoords && r.need.latitude && r.need.longitude) {
          distanceKm = calculateDistance(
            input.latitude!,
            input.longitude!,
            Number(r.need.latitude),
            Number(r.need.longitude)
          );
          if (distanceKm < 1) {
            distanceStr = `${Math.round(distanceKm * 1000)}m de você`;
          } else {
            distanceStr = `${distanceKm.toFixed(1)} km de você`;
          }
        }

        return {
          ...r.need,
          creatorName: r.creator?.name || "Cliente XamaJá",
          creatorAvatar: r.creator?.avatarUrl || null,
          applicationsCount: r.applicationsCount || 0,
          distanceKm,
          distanceStr,
        };
      });

      // Filtro de distância máxima em memória se solicitado
      if (hasUserCoords && input.maxDistanceKm && input.maxDistanceKm > 0) {
        items = items.filter(
          (item) => item.distanceKm === null || item.distanceKm <= input.maxDistanceKm!
        );
      }

      // Ordenação por distância
      if (input.sortBy === "distance" && hasUserCoords) {
        items.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }

      return {
        items,
        total: items.length,
      };
    }),

  /**
   * 5. Buscar uma necessidade específica por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const results = await dbInstance
        .select({
          need: needs,
          creator: {
            name: users.name,
            avatarUrl: users.avatarUrl,
            phone: users.phone,
            createdAt: users.createdAt,
          },
          applicationsCount: sql<number>`cast(count(${needApplications.id}) as integer)`,
        })
        .from(needs)
        .leftJoin(users, eq(needs.userId, users.openId))
        .leftJoin(needApplications, eq(needs.id, needApplications.needId))
        .where(eq(needs.id, input.id))
        .groupBy(needs.id, users.name, users.avatarUrl, users.phone, users.createdAt)
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade não encontrada",
        });
      }

      const item = results[0];
      const isOwner = ctx.user && item.need.userId === ctx.user.openId;
      const isAdmin = ctx.user && ctx.user.role === "admin";

      // Verificar se o usuário autenticado já se candidatou
      let myApplication: typeof needApplications.$inferSelect | null = null;
      if (ctx.user) {
        const appRes = await dbInstance
          .select()
          .from(needApplications)
          .where(
            and(
              eq(needApplications.needId, input.id),
              eq(needApplications.userId, ctx.user.openId),
            ),
          )
          .limit(1);

        if (appRes.length > 0) {
          myApplication = appRes[0];
        }
      }

      return {
        ...item.need,
        creatorName: item.creator?.name || "Cliente XamaJá",
        creatorAvatar: item.creator?.avatarUrl || null,
        creatorPhone: isOwner || isAdmin ? item.creator?.phone || null : null,
        creatorCreatedAt: item.creator?.createdAt || null,
        applicationsCount: item.applicationsCount || 0,
        myApplication,
        isOwner: !!isOwner,
      };
    }),

  /**
   * 6. Candidatar-se / Demonstrar interesse em uma oportunidade (Necessidade)
   */
  applyToNeed: protectedProcedure
    .input(
      z.object({
        needId: z.string().min(1),
        message: z
          .string()
          .optional()
          .default("Olá, tenho interesse nesta oportunidade e disponibilidade para o atendimento."),
        proposedPrice: z.number().positive("O valor proposto deve ser positivo").nullable().optional(),
        estimatedTime: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const needRes = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, input.needId))
        .limit(1);

      if (needRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade não encontrada",
        });
      }

      const need = needRes[0];

      if (need.status !== "ativa" || (need.filledSpots || 0) >= (need.requiredProfessionals || 1)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            (need.filledSpots || 0) >= (need.requiredProfessionals || 1)
              ? "Todas as vagas para esta necessidade já foram preenchidas."
              : `Esta oportunidade não está recebendo candidaturas (Status: ${need.status}).`,
        });
      }

      if (need.userId === ctx.user.openId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode se candidatar à sua própria publicação.",
        });
      }

      // Verificar se o profissional já se candidatou (prevenção de duplicidade)
      const existingApp = await dbInstance
        .select()
        .from(needApplications)
        .where(
          and(
            eq(needApplications.needId, input.needId),
            eq(needApplications.userId, ctx.user.openId),
          ),
        )
        .limit(1);

      if (existingApp.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você já enviou uma candidatura para esta oportunidade.",
        });
      }

      // Buscar se o usuário possui perfil de prestador cadastrado
      const providerRes = await dbInstance
        .select({ id: providers.id })
        .from(providers)
        .where(eq(providers.userId, ctx.user.openId))
        .limit(1);

      const providerId = providerRes.length > 0 ? providerRes[0].id : null;
      const applicationId = uid("app");

      await dbInstance.insert(needApplications).values({
        id: applicationId,
        needId: input.needId,
        userId: ctx.user.openId,
        providerId,
        message: input.message,
        proposedPrice: input.proposedPrice || null,
        estimatedTime: input.estimatedTime || null,
        status: "pendente",
      });

      return { success: true, id: applicationId };
    }),

  /**
   * 7. Listar candidaturas de uma necessidade (Apenas para o criador da necessidade ou admin)
   */
  listApplications: protectedProcedure
    .input(z.object({ needId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const needRes = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, input.needId))
        .limit(1);

      if (needRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade não encontrada",
        });
      }

      const need = needRes[0];
      const isOwner = need.userId === ctx.user.openId;
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o responsável pela publicação pode visualizar todas as candidaturas.",
        });
      }

      const applications = await dbInstance
        .select({
          application: needApplications,
          user: {
            name: users.name,
            email: users.email,
            phone: users.phone,
            avatarUrl: users.avatarUrl,
          },
          provider: {
            id: providers.id,
            name: providers.name,
            phone: providers.phone,
            whatsapp: providers.whatsapp,
            rating: providers.rating,
            ratingCount: providers.ratingCount,
            avatarUri: providers.avatarUri,
            category: providers.category,
            isVerified: providers.isVerified,
          },
        })
        .from(needApplications)
        .leftJoin(users, eq(needApplications.userId, users.openId))
        .leftJoin(providers, eq(needApplications.providerId, providers.id))
        .where(eq(needApplications.needId, input.needId))
        .orderBy(desc(needApplications.createdAt));

      return applications.map((a) => ({
        ...a.application,
        professionalName: a.provider?.name || a.user?.name || "Profissional",
        professionalAvatar: a.provider?.avatarUri || a.user?.avatarUrl || null,
        professionalPhone: a.provider?.phone || a.user?.phone || null,
        professionalWhatsapp: a.provider?.whatsapp || a.user?.phone || null,
        professionalRating: a.provider?.rating || 5,
        professionalRatingCount: a.provider?.ratingCount || 0,
        professionalCategory: a.provider?.category || null,
        isVerified: a.provider?.isVerified || false,
      }));
    }),

  /**
   * 8. Aceitar uma candidatura
   */
  acceptApplication: protectedProcedure
    .input(z.object({ applicationId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const appRes = await dbInstance
        .select()
        .from(needApplications)
        .where(eq(needApplications.id, input.applicationId))
        .limit(1);

      if (appRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Candidatura não encontrada",
        });
      }

      const application = appRes[0];

      const needRes = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, application.needId))
        .limit(1);

      if (needRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade vinculada não encontrada",
        });
      }

      const need = needRes[0];
      const isOwner = need.userId === ctx.user.openId;
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o responsável pela publicação pode aceitar propostas.",
        });
      }

      if (application.status === "aceita") {
        return { success: true, message: "Candidatura já aceita anteriormente." };
      }

      if ((need.filledSpots || 0) >= (need.requiredProfessionals || 1)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Todas as vagas para esta necessidade já foram preenchidas.",
        });
      }

      // Atualizar status da candidatura para aceita
      await dbInstance
        .update(needApplications)
        .set({ status: "aceita", updatedAt: new Date() })
        .where(eq(needApplications.id, input.applicationId));

      // Incrementar vagas preenchidas
      const newFilledSpots = (need.filledSpots || 0) + 1;
      const shouldClose = newFilledSpots >= (need.requiredProfessionals || 1);

      await dbInstance
        .update(needs)
        .set({
          filledSpots: newFilledSpots,
          status: shouldClose ? "encerrada" : need.status,
          updatedAt: new Date(),
        })
        .where(eq(needs.id, need.id));

      return {
        success: true,
        filledSpots: newFilledSpots,
        isFullyFilled: shouldClose,
      };
    }),

  /**
   * 9. Recusar uma candidatura
   */
  rejectApplication: protectedProcedure
    .input(z.object({ applicationId: z.string().min(1), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const appRes = await dbInstance
        .select()
        .from(needApplications)
        .where(eq(needApplications.id, input.applicationId))
        .limit(1);

      if (appRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Candidatura não encontrada",
        });
      }

      const application = appRes[0];

      const needRes = await dbInstance
        .select()
        .from(needs)
        .where(eq(needs.id, application.needId))
        .limit(1);

      if (needRes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Necessidade vinculada não encontrada",
        });
      }

      const need = needRes[0];
      const isOwner = need.userId === ctx.user.openId;
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o responsável pela publicação pode recusar propostas.",
        });
      }

      await dbInstance
        .update(needApplications)
        .set({ status: "recusada", updatedAt: new Date() })
        .where(eq(needApplications.id, input.applicationId));

      return { success: true };
    }),

  /**
   * 10. Listar as candidaturas enviadas pelo profissional autenticado
   */
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return [];

    const results = await dbInstance
      .select({
        application: needApplications,
        need: needs,
      })
      .from(needApplications)
      .innerJoin(needs, eq(needApplications.needId, needs.id))
      .where(eq(needApplications.userId, ctx.user.openId))
      .orderBy(desc(needApplications.createdAt));

    return results.map((r) => ({
      ...r.application,
      needTitle: r.need.title,
      needCategory: r.need.category,
      needCity: r.need.city,
      needStartDate: r.need.startDate,
      needBudget: r.need.budget,
      needPaymentType: r.need.paymentType,
      needStatus: r.need.status,
    }));
  }),

  /**
   * 11. Listar todas as necessidades publicadas pelo usuário logado com métricas completas
   */
  myPublishedNeeds: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["todas", "ativa", "pausada", "encerrada", "cancelada"])
            .optional()
            .default("todas"),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const statusFilter = input?.status || "todas";
      const conditions = [eq(needs.userId, ctx.user.openId)];
      if (statusFilter !== "todas") {
        conditions.push(eq(needs.status, statusFilter));
      }

      const myNeeds = await dbInstance
        .select({
          need: needs,
          totalApplications: sql<number>`cast(count(${needApplications.id}) as integer)`,
          pendingApplications: sql<number>`cast(count(case when ${needApplications.status} = 'pendente' then 1 end) as integer)`,
          acceptedApplications: sql<number>`cast(count(case when ${needApplications.status} = 'aceita' then 1 end) as integer)`,
          rejectedApplications: sql<number>`cast(count(case when ${needApplications.status} = 'recusada' then 1 end) as integer)`,
        })
        .from(needs)
        .leftJoin(needApplications, eq(needs.id, needApplications.needId))
        .where(and(...conditions))
        .groupBy(needs.id)
        .orderBy(desc(needs.createdAt));

      return myNeeds.map((row) => ({
        ...row.need,
        totalApplications: row.totalApplications || 0,
        pendingApplications: row.pendingApplications || 0,
        acceptedApplications: row.acceptedApplications || 0,
        rejectedApplications: row.rejectedApplications || 0,
      }));
    }),
});
