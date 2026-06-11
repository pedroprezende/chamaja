import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { providersDB } from "@/lib/providers-database";
import { storage } from "@/lib/storage";

export type PlanType = "monthly" | "annual" | null;

export interface ProviderProfile {
  userId: string;
  name: string;
  category: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
  avatarThumbnailUri?: string;
  coverUri?: string;
  coverThumbnailUri?: string;
  description: string;
  plan: PlanType;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  services: ProviderService[];
}

export interface ProviderService {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  /** Galeria de fotos do local (frente, interior, etc.) */
  gallery?: string[];
  createdAt: string;
}

export const PLANS = {
  monthly: { label: "Mensal", price: 10, priceLabel: "R$ 10,00/mês", period: "mês" },
  annual: { label: "Anual", price: 99.9, priceLabel: "R$ 99,90/ano", period: "ano", savings: "Economize 58%" },
};

const STORAGE_KEY = "@chamaja_provider";

interface ProviderContextType {
  provider: ProviderProfile | null;
  isProvider: boolean;
  isLoading: boolean;
  registerProvider: (data: Omit<ProviderProfile, "userId" | "plan" | "planExpiresAt" | "isActive" | "createdAt" | "services">, userId: string, plan: PlanType) => Promise<void>;
  updateProvider: (data: Partial<ProviderProfile>) => Promise<void>;
  addService: (service: Omit<ProviderService, "id" | "createdAt">) => Promise<void>;
  updateService: (id: string, data: Partial<ProviderService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  cancelPlan: () => Promise<void>;
  renewPlan: (plan: PlanType) => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProvider();
  }, []);

  const loadProvider = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setProvider(JSON.parse(raw));
    } catch {}
    setIsLoading(false);
  };

  const save = async (p: ProviderProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProvider(p);
  };

  const registerProvider = async (
    data: Omit<ProviderProfile, "userId" | "plan" | "planExpiresAt" | "isActive" | "createdAt" | "services">,
    userId: string,
    plan: PlanType
  ) => {
    const now = new Date();
    let expiresAt: string | null = null;
    if (plan === "monthly") {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === "annual") {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Upload do avatar se for local com otimização
    let finalAvatar = data.avatar;
    let finalAvatarThumbnail = data.avatarThumbnailUri || undefined;
    if (data.avatar && !data.avatar.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(data.avatar);
      if (imageUrl) finalAvatar = imageUrl;
      if (thumbnailUrl) finalAvatarThumbnail = thumbnailUrl || undefined;
    }

    // Upload da capa se houver e for local
    let finalCover = data.coverUri || undefined;
    let finalCoverThumbnail = data.coverThumbnailUri || undefined;
    if (data.coverUri && !data.coverUri.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(data.coverUri);
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
      isActive: true,
      createdAt: now.toISOString(),
      services: [],
    };
    await save(newProvider);
    // Persistir no banco global de prestadores
    await providersDB.upsertProvider({
      userId,
      name: data.name,
      category: data.category,
      city: data.city,
      neighborhood: data.neighborhood,
      phone: data.phone,
      avatar: finalAvatar,
      avatarThumbnailUri: finalAvatarThumbnail,
      coverUri: finalCover,
      coverThumbnailUri: finalCoverThumbnail,
      description: data.description,
      address: "",
      gallery: [],
      plan,
      planExpiresAt: expiresAt,
      isActive: true,
      createdAt: now.toISOString(),
      rating: 5.0,
      reviewCount: 0,
      services: [],
    });
  };

  const updateProvider = async (data: Partial<ProviderProfile>) => {
    if (!provider) return;
    const updated = { ...provider, ...data };

    // Upload do avatar se houver alteração
    if (data.avatar && !data.avatar.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(data.avatar);
      if (imageUrl) updated.avatar = imageUrl;
      if (thumbnailUrl) updated.avatarThumbnailUri = thumbnailUrl;
    }

    // Upload da capa se houver alteração
    if (data.coverUri && !data.coverUri.startsWith("http")) {
      const { imageUrl, thumbnailUrl } = await storage.uploadOptimizedImage(data.coverUri);
      if (imageUrl) updated.coverUri = imageUrl;
      if (thumbnailUrl) updated.coverThumbnailUri = thumbnailUrl;
    }

    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, {
      name: updated.name,
      category: updated.category,
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
    });
  };

  const addService = async (service: Omit<ProviderService, "id" | "createdAt">) => {
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
    const updated = { ...provider, services: [...provider.services, newService] };
    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, { services: updated.services });
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
      services: provider.services.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, { services: updated.services });
  };

  const deleteService = async (id: string) => {
    if (!provider) return;
    const updated = { ...provider, services: provider.services.filter((s) => s.id !== id) };
    await save(updated);
  };

  const cancelPlan = async () => {
    if (!provider) return;
    const updated = { ...provider, plan: null as PlanType, planExpiresAt: null };
    await save(updated);
  };

  const renewPlan = async (plan: PlanType) => {
    if (!provider) return;
    const now = new Date();
    let expiresAt: string | null = null;
    if (plan === "monthly") {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === "annual") {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    const updated = { ...provider, plan, planExpiresAt: expiresAt };
    await save(updated);
  };

  return (
    <ProviderContext.Provider
      value={{
        provider,
        isProvider: provider !== null && provider.isActive,
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
  if (!ctx) throw new Error("useProvider deve ser usado dentro de ProviderContextProvider");
  return ctx;
}
