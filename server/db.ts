import { eq, desc, asc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  categories, InsertCategory,
  subServices, InsertSubService,
  regions, InsertRegion,
  services, InsertService,
  providers, InsertProvider,
  featuredAds, InsertFeaturedAd,
  reviews, InsertReview,
  favorites,
  appEvents,
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
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  
  if (results.length === 0) {
    console.log("[Database] No categories found, seeding defaults...");
    const defaults = [
      { id: "reformas-reparos", name: "Reformas e Reparos", icon: "build" },
      { id: "assistencia-tecnica", name: "Assistência Técnica", icon: "settings" },
      { id: "servicos-domesticos", name: "Serviços Domésticos", icon: "home" },
      { id: "servicos-externos", name: "Serviços Externos", icon: "yard" },
      { id: "automotivo", name: "Automotivo", icon: "directions-car" },
    ];
    for (const d of defaults) {
      await db.insert(categories).values({ ...d, isActive: true }).catch(() => {});
    }
    return db.select().from(categories).orderBy(asc(categories.displayOrder));
  }
  
  return results;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values(data);
  return db.select().from(categories).where(eq(categories.id, data.id)).limit(1).then(r => r[0]);
}

export async function updateCategory(id: string, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ ...data, updatedAt: new Date() }).where(eq(categories.id, id));
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
  return db.select().from(subServices).where(eq(subServices.categoryId, categoryId)).orderBy(asc(subServices.displayOrder));
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
  return db.select().from(subServices).where(eq(subServices.id, data.id)).limit(1).then(r => r[0]);
}

export async function deleteSubService(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subServices).where(eq(subServices.id, id));
}

export async function updateSubService(id: string, data: Partial<InsertSubService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subServices).set({ ...data, updatedAt: new Date() }).where(eq(subServices.id, id));
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
  return db.select().from(regions).where(eq(regions.id, data.id)).limit(1).then(r => r[0]);
}

export async function updateRegion(id: string, data: Partial<InsertRegion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(regions).set({ ...data, updatedAt: new Date() }).where(eq(regions.id, id));
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
      { id: "s1", name: "Pedro Automotivo", category: "Automotivo", showOnHome: true, isActive: true, imageUri: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
      { id: "s2", name: "Theusin Serviços", category: "Serviços Externos", showOnHome: true, isActive: true, imageUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" }
    ] as typeof results;
  }
  
  return results;
}

export async function getHomeServices() {
  const db = await getDb();
  if (!db) return [];
  // Return all active services, bypassing the showOnHome filter temporarily to diagnose
  return db.select().from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.displayOrder));
}

export async function getServiceById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(services).values(data);
  return db.select().from(services).where(eq(services.id, data.id)).limit(1).then(r => r[0]);
}

export async function updateService(id: string, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(services).set({ ...data, updatedAt: new Date() }).where(eq(services.id, id));
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
    result = await q.where(eq(providers.isActive, true)).orderBy(asc(providers.displayOrder));
  } else {
    result = await q.orderBy(asc(providers.displayOrder));
  }
  return result;
}

export async function getProvidersLightweight(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select({
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
  }).from(providers);
  
  if (activeOnly) {
    return q.where(eq(providers.isActive, true)).orderBy(asc(providers.displayOrder));
  } else {
    return q.orderBy(asc(providers.displayOrder));
  }
}

export async function createProvider(data: InsertProvider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(providers).values(data);
  return db.select().from(providers).where(eq(providers.id, data.id)).limit(1).then(r => r[0]);
}

export async function updateProvider(id: string, data: Partial<InsertProvider>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(providers).set({ ...data, updatedAt: new Date() }).where(eq(providers.id, id));
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

export async function updateFeaturedAd(id: string, data: Partial<InsertFeaturedAd>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(featuredAds).set({ ...data, updatedAt: new Date() }).where(eq(featuredAds.id, id));
}
export async function createFeaturedAd(data: InsertFeaturedAd) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(featuredAds).values(data);
  return db.select().from(featuredAds).where(eq(featuredAds.id, data.id)).limit(1).then(r => r[0]);
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
  return db.select().from(reviews)
    .where(eq(reviews.professionalId, professionalId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values(data);
  return db.select().from(reviews).where(eq(reviews.id, data.id)).limit(1).then(r => r[0]);
}

// ── Favorites ─────────────────────────────────────────────────────────────────
export async function addFavorite(userId: string, providerId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(favorites).values({ userId, providerId }).catch((err) => {
    // If already favorited, ignore error (unique/primary key or constraint check if any, or just let it pass)
    console.warn("[Database] Failed to add favorite, might already exist:", err.message);
  });
}

export async function removeFavorite(userId: string, providerId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.providerId, providerId)));
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
export async function createAppEvent(data: typeof appEvents.$inferInsert): Promise<void> {
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

