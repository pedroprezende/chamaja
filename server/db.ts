import { eq, desc, asc, and, sql, or, ilike, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  categories,
  InsertCategory,
  subServices,
  InsertSubService,
  regions,
  InsertRegion,
  services,
  InsertService,
  providers,
  InsertProvider,
  featuredAds,
  InsertFeaturedAd,
  reviews,
  InsertReview,
  favorites,
  appEvents,
  admins,
  businessPermissions,
  InsertBusinessPermission,
  partners,
  referrals,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { max: 10 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0)
      updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });

    // --- NEW: Check if there's any pending invite for this user's email ---
    if (user.email) {
      const pendingProviders = await db
        .select()
        .from(providers)
        .where(eq(providers.invitedEmail, user.email));

      if (pendingProviders.length > 0) {
        let isCommerceOrProvider = false;
        
        for (const prov of pendingProviders) {
          await db
            .update(providers)
            .set({ userId: user.openId, invitedEmail: null })
            .where(eq(providers.id, prov.id));
            
          if (prov.businessType === "comercio" || prov.businessType === "prestador" || prov.categoryId === "comercios" || prov.category === "Comércios") {
            isCommerceOrProvider = true;
          }
        }

        // Se pelo menos um provider for comercio/prestador, atualiza o tipo do usuário
        const newTipo = isCommerceOrProvider ? "comercio" : "prestador";
        await db
          .update(users)
          .set({ tipo: newTipo })
          .where(eq(users.openId, user.openId));
          
        console.info(`[Database] Auto-bound ${pendingProviders.length} provider(s) to new user ${user.email} (${user.openId})`);
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  if (result.length > 0) {
    const user = result[0];
    const adminRecord = await db
      .select()
      .from(admins)
      .where(eq(admins.openId, openId))
      .limit(1);
    if (adminRecord.length > 0) {
      return {
        ...user,
        role: "admin" as const,
        adminRole: adminRecord[0].adminRole,
      };
    }
    return user;
  }
  return undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (result.length > 0) {
    const user = result[0];
    const adminRecord = await db
      .select()
      .from(admins)
      .where(eq(admins.openId, user.openId))
      .limit(1);
    if (adminRecord.length > 0) {
      return {
        ...user,
        role: "admin" as const,
        adminRole: adminRecord[0].adminRole,
      };
    }
    return user;
  }
  return undefined;
}

export async function updateUserOpenId(oldOpenId: string, newOpenId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user openId: database not available");
    return;
  }

  // 1. Fetch user's favorites
  const userFavs = await db.select().from(favorites).where(eq(favorites.userId, oldOpenId));
  // 2. Delete user's favorites
  if (userFavs.length > 0) {
    await db.delete(favorites).where(eq(favorites.userId, oldOpenId));
  }

  // 3. Fetch referrals for this partner
  const partnerRefs = await db.select().from(referrals).where(eq(referrals.partnerId, oldOpenId));
  // 4. Delete referrals
  if (partnerRefs.length > 0) {
    await db.delete(referrals).where(eq(referrals.partnerId, oldOpenId));
  }

  // 5. Update providers where userId is oldOpenId
  await db.update(providers).set({ userId: newOpenId }).where(eq(providers.userId, oldOpenId));

  // 6. Update admins where openId is oldOpenId
  await db.update(admins).set({ openId: newOpenId }).where(eq(admins.openId, oldOpenId));

  // 7. Update partners where id is oldOpenId
  await db.update(partners).set({ id: newOpenId }).where(eq(partners.id, oldOpenId));

  // 8. Finally, update users openId
  await db.update(users).set({ openId: newOpenId }).where(eq(users.openId, oldOpenId));

  // 9. Re-insert favorites with newOpenId
  for (const fav of userFavs) {
    await db.insert(favorites).values({
      userId: newOpenId,
      providerId: fav.providerId,
      createdAt: fav.createdAt,
    }).catch(err => console.error("Error re-inserting favorite:", err));
  }

  // 10. Re-insert referrals with newOpenId
  for (const ref of partnerRefs) {
    await db.insert(referrals).values({
      partnerId: newOpenId,
      codigoIndicacao: ref.codigoIndicacao,
      nomeIndicado: ref.nomeIndicado,
      telefoneIndicado: ref.telefoneIndicado,
      status: ref.status,
      createdAt: ref.createdAt,
    }).catch(err => console.error("Error re-inserting referral:", err));
  }
}

export async function updateUserProfile(openId: string, updates: { tipo?: string; phone?: string; name?: string }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user profile: database not available");
    return;
  }
  await db
    .update(users)
    .set({
      ...(updates.tipo ? { tipo: updates.tipo } : {}),
      ...(updates.phone ? { phone: updates.phone } : {}),
      ...(updates.name ? { name: updates.name } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.openId, openId));
}

export async function deleteUserFully(openId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. Delete provider associated with the user if they are a provider
    await db.delete(providers).where(eq(providers.userId, openId));

    // 2. Delete favorites
    await db.delete(favorites).where(eq(favorites.userId, openId));

    // 3. Delete user from public.users
    await db.delete(users).where(eq(users.openId, openId));

    // 4. Delete from auth.users (Supabase Auth)
    await db.execute(sql`DELETE FROM auth.users WHERE id = ${openId}::uuid`);
  } catch (error) {
    console.error("[Database] Failed to delete user fully:", error);
    throw error;
  }
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.displayOrder));
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder));

  if (results.length === 0) {
    console.log("[Database] No categories found, seeding defaults...");
    const defaults = [
      { id: "reformas-reparos", name: "Reformas e Reparos", icon: "build" },
      {
        id: "assistencia-tecnica",
        name: "Assistência Técnica",
        icon: "settings",
      },
      { id: "servicos-domesticos", name: "Serviços Domésticos", icon: "home" },
      { id: "servicos-externos", name: "Serviços Externos", icon: "yard" },
      { id: "automotivo", name: "Automotivo", icon: "directions-car" },
    ];
    for (const d of defaults) {
      await db
        .insert(categories)
        .values({ ...d, isActive: true })
        .catch(() => {});
    }
    return db.select().from(categories).orderBy(asc(categories.displayOrder));
  }

  return results;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values(data);
  return db
    .select()
    .from(categories)
    .where(eq(categories.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function updateCategory(
  id: string,
  data: Partial<InsertCategory>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ── Sub-services ──────────────────────────────────────────────────────────────
export async function getSubServicesByCategoryId(categoryId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(subServices)
    .where(eq(subServices.categoryId, categoryId))
    .orderBy(asc(subServices.displayOrder));
}

export async function getAllSubServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subServices).orderBy(asc(subServices.displayOrder));
}

export async function createSubService(data: InsertSubService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subServices).values(data);
  return db
    .select()
    .from(subServices)
    .where(eq(subServices.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function deleteSubService(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subServices).where(eq(subServices.id, id));
}

export async function updateSubService(
  id: string,
  data: Partial<InsertSubService>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(subServices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subServices.id, id));
}

// ── Regions ───────────────────────────────────────────────────────────────────
export async function getRegions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(regions).orderBy(asc(regions.name));
}

export async function createRegion(data: InsertRegion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(regions).values(data);
  return db
    .select()
    .from(regions)
    .where(eq(regions.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function updateRegion(id: string, data: Partial<InsertRegion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(regions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(regions.id, id));
}

export async function deleteRegion(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(regions).where(eq(regions.id, id));
}

// ── Services ─────────────────────────────────────────────────────────────────
export async function getServices(activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(services);
  if (activeOnly) query.where(eq(services.isActive, true));
  const results = await query.orderBy(asc(services.displayOrder));

  if (results.length === 0 && activeOnly) {
    // Fallback if empty
    return [
      {
        id: "s1",
        name: "Pedro Automotivo",
        category: "Automotivo",
        showOnHome: true,
        isActive: true,
        imageUri:
          "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80",
      },
      {
        id: "s2",
        name: "Theusin Serviços",
        category: "Serviços Externos",
        showOnHome: true,
        isActive: true,
        imageUri:
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
      },
    ] as typeof results;
  }

  return results;
}

export async function getHomeServices() {
  const db = await getDb();
  if (!db) return [];
  // Return all active services, bypassing the showOnHome filter temporarily to diagnose
  return db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.displayOrder));
}

export async function getServiceById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return result[0];
}

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(services).values(data);
  return db
    .select()
    .from(services)
    .where(eq(services.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function updateService(id: string, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(services)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(services.id, id));
}

export async function deleteService(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(services).where(eq(services.id, id));
}

// ── Providers ─────────────────────────────────────────────────────────────────
export async function getProviders(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(providers);
  let result;
  if (activeOnly) {
    result = await q
      .where(eq(providers.isActive, true))
      .orderBy(asc(providers.displayOrder));
  } else {
    result = await q.orderBy(asc(providers.displayOrder));
  }
  return result;
}

export async function getProvidersLightweight(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const q = db
    .select({
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
      businessType: providers.businessType,
      deliveryTime: providers.deliveryTime,
    })
    .from(providers);

  if (activeOnly) {
    return q
      .where(eq(providers.isActive, true))
      .orderBy(asc(providers.displayOrder));
  } else {
    return q.orderBy(asc(providers.displayOrder));
  }
}

export async function createProvider(data: InsertProvider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(providers).values(data);
  return db
    .select()
    .from(providers)
    .where(eq(providers.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function updateProvider(
  id: string,
  data: Partial<InsertProvider>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(providers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(providers.id, id));
}

export async function deleteProvider(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(providers).where(eq(providers.id, id));
}

// ── Featured Ads ──────────────────────────────────────────────────────────────
export async function getFeaturedAds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featuredAds).orderBy(asc(featuredAds.displayOrder));
}

export async function updateFeaturedAd(
  id: string,
  data: Partial<InsertFeaturedAd>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(featuredAds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(featuredAds.id, id));
}
export async function createFeaturedAd(data: InsertFeaturedAd) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(featuredAds).values(data);
  return db
    .select()
    .from(featuredAds)
    .where(eq(featuredAds.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

export async function deleteFeaturedAd(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(featuredAds).where(eq(featuredAds.id, id));
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function getReviewsByProfessional(professionalId: string) {
  const db = await getDb();
  if (!db) return [];

  const provs = await db
    .select({ id: providers.id, userId: providers.userId })
    .from(providers)
    .where(or(eq(providers.id, professionalId), eq(providers.userId, professionalId)))
    .limit(1);

  const targetIds = [professionalId];
  if (provs.length > 0) {
    if (provs[0].id && !targetIds.includes(provs[0].id)) targetIds.push(provs[0].id);
    if (provs[0].userId && !targetIds.includes(provs[0].userId)) targetIds.push(provs[0].userId);
  }

  return db
    .select()
    .from(reviews)
    .where(inArray(reviews.professionalId, targetIds))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values(data);
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.id, data.id))
    .limit(1)
    .then((r) => r[0]);
}

// ── Favorites ─────────────────────────────────────────────────────────────────
export async function addFavorite(
  userId: string,
  providerId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(favorites)
    .values({ userId, providerId })
    .catch((err) => {
      // If already favorited, ignore error (unique/primary key or constraint check if any, or just let it pass)
      console.warn(
        "[Database] Failed to add favorite, might already exist:",
        err.message,
      );
    });
}

export async function removeFavorite(
  userId: string,
  providerId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(favorites)
    .where(
      and(eq(favorites.userId, userId), eq(favorites.providerId, providerId)),
    );
}

export async function getFavoritesByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select({
      provider: providers,
    })
    .from(favorites)
    .innerJoin(providers, eq(favorites.providerId, providers.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return results.map((r) => r.provider);
}

// ── Analytics Events ──────────────────────────────────────────────────────────
export async function createAppEvent(
  data: typeof appEvents.$inferInsert,
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert app event: database not available");
    return;
  }
  try {
    await db.insert(appEvents).values(data);
  } catch (error) {
    console.error("[Database] Failed to insert app event:", error);
  }
}

// ── Partners & Referrals ──────────────────────────────────────────────────────
export async function createPartner(
  data: typeof partners.$inferInsert,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(partners).values(data);
}

export async function getPartnerById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partners)
    .where(eq(partners.id, id))
    .limit(1);
  return result[0];
}

export async function updatePartner(
  id: string,
  data: Partial<typeof partners.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(partners)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(partners.id, id));
}

export async function getPartnerByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(partners)
    .where(eq(partners.codigoIndicacao, code))
    .limit(1);
  return result[0];
}

export async function getReferralsByPartnerId(partnerId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(referrals)
    .where(eq(referrals.partnerId, partnerId))
    .orderBy(desc(referrals.createdAt));
}

export async function createReferral(data: typeof referrals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(referrals).values(data);
}

export async function getAllReferrals() {
  const db = await getDb();
  if (!db) return [];

  // Consulta customizada com join para exibir o nome do parceiro
  return db
    .select({
      id: referrals.id,
      codigoIndicacao: referrals.codigoIndicacao,
      nomeIndicado: referrals.nomeIndicado,
      telefoneIndicado: referrals.telefoneIndicado,
      status: referrals.status,
      createdAt: referrals.createdAt,
      partnerName: partners.nome,
    })
    .from(referrals)
    .innerJoin(partners, eq(referrals.partnerId, partners.id))
    .orderBy(desc(referrals.createdAt));
}

export async function updateReferralStatus(
  id: number,
  status: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(referrals).set({ status }).where(eq(referrals.id, id));
}

export async function getProviderByUserId(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userId))
    .limit(1);
  return result[0];
}

export async function getBusinessPermissionByProviderId(providerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(businessPermissions)
    .where(eq(businessPermissions.businessId, providerId))
    .limit(1);
  return result[0];
}

export async function createBusinessPermission(
  data: typeof businessPermissions.$inferInsert,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(businessPermissions).values(data);
}

// ── Ownership Transfer ────────────────────────────────────────────────────────

/**
 * Search users by email, phone, openId or name (partial match).
 * Used by the admin to find a user to transfer a provider profile to.
 */
export async function searchUsersForTransfer(query: string) {
  const db = await getDb();
  if (!db) return [];

  const q = query.trim();
  if (!q) return [];

  const partial = `%${q}%`;

  const results = await db
    .select({
      openId: users.openId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      tipo: users.tipo,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      or(
        eq(users.openId, q),
        ilike(users.email, partial),
        ilike(users.phone, partial),
        ilike(users.name, partial),
      ),
    )
    .limit(10);

  return results;
}

/**
 * Transfer (or revoke) ownership of a provider profile.
 * Pass newUserId = null to remove the current owner.
 * When assigning a new owner, also updates users.tipo to match the business type.
 */
export async function transferProviderOwnership(
  providerId: string,
  newUserId: string | null,
  invitedEmail?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Fetch the provider to know its businessType and current userId
  const providerRows = await db
    .select({ businessType: providers.businessType, currentUserId: providers.userId })
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);

  if (providerRows.length === 0) throw new Error("Provider não encontrado.");

  const previousUserId = providerRows[0].currentUserId;

  // 2. Update providers.userId and invitedEmail
  await db
    .update(providers)
    .set({ 
      userId: newUserId, 
      invitedEmail: invitedEmail || null, 
      updatedAt: new Date() 
    })
    .where(eq(providers.id, providerId));

  // 3. If assigning a new owner (existing user), update their tipo in users table
  if (newUserId) {
    const businessType = providerRows[0].businessType;
    const newTipo =
      businessType === "comercio" || businessType === "alimentacao"
        ? "comercio"
        : "prestador";

    await db
      .update(users)
      .set({ tipo: newTipo, updatedAt: new Date() })
      .where(eq(users.openId, newUserId));
  }

  // 4. If previous owner exists and is different from new owner, check if they still own any other providers
  if (previousUserId && previousUserId !== newUserId) {
    const otherProviders = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.userId, previousUserId))
      .limit(1);

    if (otherProviders.length === 0) {
      await db
        .update(users)
        .set({ tipo: "cliente", updatedAt: new Date() })
        .where(eq(users.openId, previousUserId));
    }
  }
}
