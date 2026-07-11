import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { providersDB } from "@/lib/providers-database";
import { storage } from "@/lib/storage";
import { useAuth } from "./auth-context";

export type PlanType = "monthly" | "annual" | "free" | null;

export interface ProviderProfile {
  userId: string;
  name: string;
  category: string;
  categoryId?: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
  avatarThumbnailUri?: string;
  coverUri?: string;
  coverThumbnailUri?: string;
  description: string;
  plan: PlanType;
  planId?: string | null;
  planStatus?: string | null;
  billingCycle?: string | null;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  services: ProviderService[];
  address?: string;
  latitude?: number;
  longitude?: number;
  workingHours?: any;
  gallery?: string[];
  maxServicos?: number;
  permissionsStatus?: string;
  hasCatalog?: boolean;
  status?: string;
  businessType?: string;
  deliveryTime?: string | null;
  benefitKeys: string[];
}

export interface ProviderService {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  /** Galeria de fotos do local (frente, interior, etc.) */
  gallery?: string[];
  createdAt: string;
  price?: number;
  productCategory?: string;
}

export const PLANS = {
  free: {
    label: "Gratuito",
    price: 0,
    priceLabel: "Grátis",
    period: "sempre",
    savings: undefined,
  },
  monthly: {
    label: "Mensal",
    price: 10,
    priceLabel: "R$ 10,00/mês",
    period: "mês",
  },
  annual: {
    label: "Anual",
    price: 99.9,
    priceLabel: "R$ 99,90/ano",
    period: "ano",
    savings: "Economize 58%",
  },
};

const STORAGE_KEY = "@chamaja_provider";

interface ProviderContextType {
  provider: ProviderProfile | null;
  isProvider: boolean;
  hasProviderProfile: boolean;
  providerStatus: string | null;
  isLoading: boolean;
  registerProvider: (
    data: Omit<
      ProviderProfile,
      | "userId"
      | "plan"
      | "planExpiresAt"
      | "isActive"
      | "createdAt"
      | "services"
    >,
    userId: string,
    plan: PlanType,
  ) => Promise<void>;
  updateProvider: (data: Partial<ProviderProfile>) => Promise<void>;
  addService: (
    service: Omit<ProviderService, "id" | "createdAt">,
  ) => Promise<void>;
  updateService: (id: string, data: Partial<ProviderService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  cancelPlan: () => Promise<void>;
  renewPlan: (plan: PlanType) => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType | undefined>(
  undefined,
);

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadAndSyncProvider();
  }, [user?.id]);

  const loadAndSyncProvider = async () => {
    setIsLoading(true);
    let localProvider: ProviderProfile | null = null;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        localProvider = JSON.parse(raw);
        setProvider(localProvider);
      }
    } catch {}

    if (user?.id) {
      try {
        const dbProvider = await providersDB.getById(user.id);
        if (dbProvider) {
          const syncedProvider: ProviderProfile = {
            userId: dbProvider.userId,
            name: dbProvider.name,
            category: dbProvider.category,
            categoryId: dbProvider.categoryId,
            city: dbProvider.city,
            neighborhood: dbProvider.neighborhood,
            phone: dbProvider.phone,
            avatar: dbProvider.avatar,
            avatarThumbnailUri: dbProvider.avatarThumbnailUri,
            coverUri: dbProvider.coverUri,
            coverThumbnailUri: dbProvider.coverThumbnailUri,
            description: dbProvider.description,
            plan: dbProvider.plan,
            planExpiresAt: dbProvider.planExpiresAt,
            isActive: dbProvider.isActive,
            createdAt: dbProvider.createdAt,
            services: dbProvider.services || [],
            address: dbProvider.address,
            latitude: dbProvider.latitude,
            longitude: dbProvider.longitude,
            workingHours: dbProvider.workingHours,
            gallery: dbProvider.gallery,
            maxServicos: dbProvider.maxServicos,
            permissionsStatus: dbProvider.permissionsStatus,
            hasCatalog: dbProvider.hasCatalog,
            businessType: dbProvider.businessType,
            deliveryTime: dbProvider.deliveryTime,
          };
          await save(syncedProvider);
        }
      } catch (err) {
        console.error(
          "[ProviderContext] Failed to sync provider with database:",
          err,
        );
      }
    } else {
      setProvider(null);
    }
    setIsLoading(false);
  };

  const save = async (p: ProviderProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProvider(p);
  };

  const registerProvider = async (
    data: Omit<
      ProviderProfile,
      | "userId"
      | "plan"
      | "planExpiresAt"
      | "isActive"
      | "createdAt"
      | "services"
    >,
    userId: string,
    plan: PlanType,
  ) => {
    const now = new Date();
    let expiresAt: string | null = null;
    if (plan === "monthly") {
      expiresAt = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
    } else if (plan === "annual") {
      expiresAt = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString();
    }

    // Upload do avatar se for local com otimização
    let finalAvatar = data.avatar;
    let finalAvatarThumbnail = data.avatarThumbnailUri || undefined;
    if (data.avatar && !data.avatar.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(
        data.avatar,
      );
      if (imageUrl) finalAvatar = imageUrl;
      if (thumbnailUrl) finalAvatarThumbnail = thumbnailUrl || undefined;
    }

    // Upload da capa se houver e for local
    let finalCover = data.coverUri || undefined;
    let finalCoverThumbnail = data.coverThumbnailUri || undefined;
    if (data.coverUri && !data.coverUri.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(
        data.coverUri,
      );
      if (imageUrl) finalCover = imageUrl;
      if (thumbnailUrl) finalCoverThumbnail = thumbnailUrl || undefined;
    }

    const newProvider: ProviderProfile = {
      ...data,
      avatar: finalAvatar,
      avatarThumbnailUri: finalAvatarThumbnail,
      coverUri: finalCover,
      coverThumbnailUri: finalCoverThumbnail,
      userId,
      plan,
      planExpiresAt: expiresAt,
      isActive: false,
      status: "pendente",
      createdAt: now.toISOString(),
      services: [],
    };
    await save(newProvider);
    // Persistir no banco global de prestadores
    await providersDB.upsertProvider({
      userId,
      name: data.name,
      category: data.category,
      categoryId: data.categoryId,
      city: data.city,
      neighborhood: data.neighborhood,
      phone: data.phone,
      avatar: finalAvatar,
      avatarThumbnailUri: finalAvatarThumbnail,
      coverUri: finalCover,
      coverThumbnailUri: finalCoverThumbnail,
      description: data.description,
      address: data.address || "",
      gallery: data.gallery || [],
      plan,
      planExpiresAt: expiresAt,
      isActive: false,
      status: "pendente",
      createdAt: now.toISOString(),
      rating: 5.0,
      reviewCount: 0,
      services: [],
      latitude: data.latitude,
      longitude: data.longitude,
      workingHours: data.workingHours,
      businessType: data.businessType,
      deliveryTime: data.deliveryTime,
    });
  };

  const updateProvider = async (data: Partial<ProviderProfile>) => {
    if (!provider) return;
    const updated = { ...provider, ...data };

    // Upload do avatar se houver alteração
    if (data.avatar && !data.avatar.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(
        data.avatar,
      );
      if (imageUrl) updated.avatar = imageUrl;
      if (thumbnailUrl) updated.avatarThumbnailUri = thumbnailUrl;
    }

    // Upload da capa se houver alteração
    if (data.coverUri && !data.coverUri.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(
        data.coverUri,
      );
      if (imageUrl) updated.coverUri = imageUrl;
      if (thumbnailUrl) updated.coverThumbnailUri = thumbnailUrl;
    }

    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, {
      name: updated.name,
      category: updated.category,
      categoryId: updated.categoryId,
      city: updated.city,
      neighborhood: updated.neighborhood,
      phone: updated.phone,
      avatar: updated.avatar,
      avatarThumbnailUri: updated.avatarThumbnailUri,
      coverUri: updated.coverUri,
      coverThumbnailUri: updated.coverThumbnailUri,
      description: updated.description,
      plan: updated.plan,
      planExpiresAt: updated.planExpiresAt,
      isActive: updated.isActive,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
      workingHours: updated.workingHours,
      gallery: updated.gallery,
      businessType: updated.businessType,
      deliveryTime: updated.deliveryTime,
    });
  };

  const addService = async (
    service: Omit<ProviderService, "id" | "createdAt">,
  ) => {
    if (!provider) return;

    // Upload da imagem principal do serviço com otimização
    let finalImageUri = service.imageUri;
    if (service.imageUri && !service.imageUri.startsWith("http")) {
      const { optimizeImage } = await import("./image-optimizer");
      const optimized = await optimizeImage(service.imageUri, 800, 0.8);
      const uploadedUrl = await storage.uploadImage(optimized);
      if (uploadedUrl) finalImageUri = uploadedUrl;
    }

    // Upload da galeria do serviço com otimização
    let finalGallery: string[] = [];
    if (service.gallery && service.gallery.length > 0) {
      const { optimizeImage } = await import("./image-optimizer");
      for (const uri of service.gallery) {
        if (uri.startsWith("http")) {
          finalGallery.push(uri);
        } else {
          const optimized = await optimizeImage(uri, 800, 0.8);
          const uploadedUrl = await storage.uploadImage(optimized);
          if (uploadedUrl) finalGallery.push(uploadedUrl);
        }
      }
    }

    const newService: ProviderService = {
      ...service,
      imageUri: finalImageUri,
      gallery: finalGallery.length > 0 ? finalGallery : undefined,
      id: `svc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...provider,
      services: [...provider.services, newService],
    };
    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, {
      services: updated.services,
    });
  };

  const updateService = async (id: string, data: Partial<ProviderService>) => {
    if (!provider) return;

    const updates = { ...data };

    // Upload da imagem se mudou (com otimização)
    if (data.imageUri && !data.imageUri.startsWith("http")) {
      const { optimizeImage } = await import("./image-optimizer");
      const optimized = await optimizeImage(data.imageUri, 800, 0.8);
      const uploadedUrl = await storage.uploadImage(optimized);
      if (uploadedUrl) updates.imageUri = uploadedUrl;
    }

    // Upload da galeria se mudou (com otimização)
    if (data.gallery && data.gallery.length > 0) {
      const finalGallery: string[] = [];
      const { optimizeImage } = await import("./image-optimizer");
      for (const uri of data.gallery) {
        if (uri.startsWith("http")) {
          finalGallery.push(uri);
        } else {
          const optimized = await optimizeImage(uri, 800, 0.8);
          const uploadedUrl = await storage.uploadImage(optimized);
          if (uploadedUrl) finalGallery.push(uploadedUrl);
        }
      }
      updates.gallery = finalGallery;
    }

    const updated = {
      ...provider,
      services: provider.services.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    };
    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, {
      services: updated.services,
    });
  };

  const deleteService = async (id: string) => {
    if (!provider) return;
    const updated = {
      ...provider,
      services: provider.services.filter((s) => s.id !== id),
    };
    await save(updated);
  };

  const cancelPlan = async () => {
    if (!provider) return;
    const updated = {
      ...provider,
      plan: null as PlanType,
      planExpiresAt: null,
    };
    await save(updated);
  };

  const renewPlan = async (plan: PlanType) => {
    if (!provider) return;
    const now = new Date();
    let expiresAt: string | null = null;
    if (plan === "monthly") {
      expiresAt = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
    } else if (plan === "annual") {
      expiresAt = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString();
    }
    const updated = { ...provider, plan, planExpiresAt: expiresAt };
    await save(updated);
  };

  return (
    <ProviderContext.Provider
      value={{
        provider,
        isProvider:
          provider !== null &&
          provider.isActive &&
          provider.permissionsStatus !== "bloqueado",
        hasProviderProfile: provider !== null,
        providerStatus: provider?.status || null,
        isLoading,
        registerProvider,
        updateProvider,
        addService,
        updateService,
        deleteService,
        cancelPlan,
        renewPlan,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const ctx = useContext(ProviderContext);
  if (!ctx)
    throw new Error(
      "useProvider deve ser usado dentro de ProviderContextProvider",
    );
  return ctx;
}
