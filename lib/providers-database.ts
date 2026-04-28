/**
 * Banco de dados global de prestadores de serviço
 * Persiste todos os prestadores cadastrados via AsyncStorage
 * Separado do ProviderContext (que gerencia apenas o prestador do usuário logado)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoredProvider {
  userId: string;
  name: string;
  category: string;
  categoryId?: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
  description: string;
  plan: "monthly" | "annual" | null;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  rating: number;
  reviewCount: number;
  services: Array<{
    id: string;
    name: string;
    description: string;
    imageUri?: string;
    createdAt: string;
  }>;
}

const STORAGE_KEY = "@chamaja_all_providers";

let _initialized = false;
let _providers: StoredProvider[] = [];

async function ensureLoaded(): Promise<void> {
  if (_initialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      _providers = JSON.parse(raw) as StoredProvider[];
    } else {
      _providers = [];
    }
  } catch {
    _providers = [];
  }
  _initialized = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_providers));
  } catch {
    // silently ignore
  }
}

export const providersDB = {
  /**
   * Registra ou atualiza um prestador no banco global.
   * Chamado quando o usuário se cadastra como prestador.
   */
  upsertProvider: async (provider: StoredProvider): Promise<void> => {
    await ensureLoaded();
    const idx = _providers.findIndex((p) => p.userId === provider.userId);
    if (idx !== -1) {
      _providers[idx] = { ..._providers[idx], ...provider };
    } else {
      _providers.push(provider);
    }
    await persist();
  },

  /**
   * Atualiza campos específicos de um prestador.
   */
  updateProvider: async (userId: string, updates: Partial<StoredProvider>): Promise<void> => {
    await ensureLoaded();
    const idx = _providers.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      _providers[idx] = { ..._providers[idx], ...updates };
      await persist();
    }
  },

  /**
   * Remove um prestador do banco global.
   */
  removeProvider: async (userId: string): Promise<void> => {
    await ensureLoaded();
    _providers = _providers.filter((p) => p.userId !== userId);
    await persist();
  },

  /**
   * Retorna todos os prestadores ativos.
   */
  getAllActive: async (): Promise<StoredProvider[]> => {
    await ensureLoaded();
    return _providers.filter((p) => p.isActive);
  },

  /**
   * Retorna prestadores por categoria (nome ou ID).
   */
  getByCategory: async (categoryOrId: string): Promise<StoredProvider[]> => {
    await ensureLoaded();
    const lower = categoryOrId.toLowerCase();
    return _providers.filter(
      (p) =>
        p.isActive &&
        (p.category.toLowerCase().includes(lower) ||
          p.categoryId?.toLowerCase() === lower)
    );
  },

  /**
   * Busca prestadores por texto (nome, categoria, cidade, descrição).
   */
  search: async (query: string): Promise<StoredProvider[]> => {
    await ensureLoaded();
    const q = query.toLowerCase().trim();
    if (!q) return _providers.filter((p) => p.isActive);
    return _providers.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q))
    );
  },

  /**
   * Retorna um prestador pelo userId.
   */
  getById: async (userId: string): Promise<StoredProvider | null> => {
    await ensureLoaded();
    return _providers.find((p) => p.userId === userId) ?? null;
  },

  /**
   * Invalida o cache para forçar releitura do AsyncStorage.
   */
  resetCache: (): void => {
    _initialized = false;
    _providers = [];
  },
};
