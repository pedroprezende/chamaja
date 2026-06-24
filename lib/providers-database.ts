import { trpcVanilla } from "./trpc-vanilla";

export interface StoredProvider {
  userId: string;
  name: string;
  category: string;
  categoryId?: string;
  subcategoryName?: string;
  subcategoryId?: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
  avatarThumbnailUri?: string;
  coverUri?: string;
  coverThumbnailUri?: string;
  description: string;
  address: string;
  gallery: string[];
  plan: "monthly" | "annual" | "free" | null;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  rating: number;
  reviewCount: number;
  latitude?: number;
  longitude?: number;
  maxServicos?: number;
  permissionsStatus?: string;
  workingHours?: any;
  hasCatalog?: boolean;
  status?: string;
  businessType?: string;
  deliveryTime?: string | null;
  services: Array<{
    id: string;
    name: string;
    description: string;
    imageUri?: string;
    createdAt: string;
  }>;
}

// Helper to map DB provider to StoredProvider
function mapToStoredProvider(dbProvider: any): StoredProvider {
  let parsedServices = [];
  try {
    parsedServices = dbProvider.services ? JSON.parse(dbProvider.services) : [];
  } catch (e) {
    parsedServices = [];
  }

  return {
    userId: dbProvider.userId || dbProvider.id,
    name: dbProvider.name || "",
    category: dbProvider.category || "",
    categoryId: dbProvider.categoryId || undefined,
    subcategoryName: dbProvider.subcategoryName || undefined,
    subcategoryId: dbProvider.subcategoryId || undefined,
    city: dbProvider.city || "",
    neighborhood: dbProvider.neighborhood || "",
    phone: dbProvider.phone || dbProvider.whatsapp || "",
    avatar: dbProvider.avatarUri || "",
    avatarThumbnailUri: dbProvider.avatarThumbnailUri || null,
    coverUri: dbProvider.coverUri || null,
    coverThumbnailUri: dbProvider.coverThumbnailUri || null,
    description: dbProvider.description || "",
    address: dbProvider.address || "",
    gallery: dbProvider.gallery || [],
    plan: (dbProvider.plan as any) || null,
    planExpiresAt: dbProvider.planExpiresAt
      ? new Date(dbProvider.planExpiresAt).toISOString()
      : null,
    isActive: dbProvider.isActive ?? true,
    createdAt: dbProvider.createdAt
      ? new Date(dbProvider.createdAt).toISOString()
      : new Date().toISOString(),
    rating: dbProvider.rating || 0,
    reviewCount: dbProvider.ratingCount || 0,
    services: parsedServices,
    latitude:
      dbProvider.latitude !== null && dbProvider.latitude !== undefined
        ? Number(dbProvider.latitude)
        : undefined,
    longitude:
      dbProvider.longitude !== null && dbProvider.longitude !== undefined
        ? Number(dbProvider.longitude)
        : undefined,
    maxServicos:
      dbProvider.maxServicos !== undefined
        ? Number(dbProvider.maxServicos)
        : undefined,
    permissionsStatus: dbProvider.permissionsStatus || undefined,
    workingHours: dbProvider.workingHours || undefined,
    hasCatalog: dbProvider.hasCatalog ?? false,
    status: dbProvider.status || "pendente",
    businessType: dbProvider.businessType || "servicos",
    deliveryTime: dbProvider.deliveryTime || null,
  };
}

export const providersDB = {
  upsertProvider: async (provider: StoredProvider): Promise<void> => {
    try {
      await trpcVanilla.providers.upsert.mutate(provider);
    } catch (err) {
      console.error("[providersDB] Failed to upsert", err);
    }
  },

  updateProvider: async (
    userId: string,
    updates: Partial<StoredProvider>,
  ): Promise<void> => {
    try {
      await trpcVanilla.providers.updateProvider.mutate({ userId, updates });
    } catch (err) {
      console.error("[providersDB] Failed to update", err);
    }
  },

  removeProvider: async (userId: string): Promise<void> => {
    try {
      await trpcVanilla.providers.removeProvider.mutate(userId);
    } catch (err) {
      console.error("[providersDB] Failed to remove", err);
    }
  },

  getAllActive: async (): Promise<StoredProvider[]> => {
    try {
      const res = await trpcVanilla.providers.list.query();
      return res.map(mapToStoredProvider);
    } catch (err) {
      console.error("[providersDB] Failed to get all", err);
      return [];
    }
  },

  getByCategory: async (categoryOrId: string): Promise<StoredProvider[]> => {
    try {
      const res = await trpcVanilla.providers.getByCategory.query(categoryOrId);
      return res.map(mapToStoredProvider);
    } catch (err) {
      console.error("[providersDB] Failed to get by category", err);
      return [];
    }
  },

  search: async (query: string): Promise<StoredProvider[]> => {
    if (!query) return providersDB.getAllActive();
    try {
      const res = await trpcVanilla.providers.search.query(query);
      return res.map(mapToStoredProvider);
    } catch (err) {
      console.error("[providersDB] Failed to search", err);
      return [];
    }
  },

  getById: async (userId: string): Promise<StoredProvider | null> => {
    try {
      const res = await trpcVanilla.providers.getById.query(userId);
      return res ? mapToStoredProvider(res) : null;
    } catch (err) {
      console.error("[providersDB] Failed to get by id", err);
      return null;
    }
  },

  resetCache: (): void => {
    // No-op for cloud db
  },
};
