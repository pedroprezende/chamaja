import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { providersDB } from "@/lib/providers-database";

export type PlanType = "monthly" | "annual" | null;

export interface ProviderProfile {
  userId: string;
  name: string;
  category: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
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
    const newProvider: ProviderProfile = {
      ...data,
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
      avatar: data.avatar,
      description: data.description,
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
    await save(updated);
    // Sincronizar com o banco global
    await providersDB.updateProvider(provider.userId, {
      name: updated.name,
      category: updated.category,
      city: updated.city,
      neighborhood: updated.neighborhood,
      phone: updated.phone,
      avatar: updated.avatar,
      description: updated.description,
      plan: updated.plan,
      planExpiresAt: updated.planExpiresAt,
      isActive: updated.isActive,
    });
  };

  const addService = async (service: Omit<ProviderService, "id" | "createdAt">) => {
    if (!provider) return;
    const newService: ProviderService = {
      ...service,
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
    const updated = {
      ...provider,
      services: provider.services.map((s) => (s.id === id ? { ...s, ...data } : s)),
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
