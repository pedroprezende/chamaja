/**
 * Banco de dados de Prestadores Admin
 * Gerencia profissionais/empresas cadastrados pelo admin, vinculados a serviços.
 * Persistência via AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdminProvider {
  id: string;
  /** Nome do profissional ou empresa */
  name: string;
  /** ID do serviço ao qual está vinculado (ex: "tatuador") */
  serviceId: string;
  /** Nome legível do serviço (ex: "Tatuador") */
  serviceName: string;
  /** ID da subcategoria (ex: "tatuador") */
  subcategoryId?: string;
  /** Nome da subcategoria */
  subcategoryName?: string;
  /** Número de WhatsApp (somente dígitos) */
  whatsapp?: string;
  /** Descrição / especialidades */
  description?: string;
  /** Endereço (bairro/cidade) */
  address?: string;
  /** Foto de perfil / logo */
  avatarUri?: string;
  /** Galeria de fotos do local */
  gallery?: string[];
  /** Avaliação média (0-5) */
  rating?: number;
  /** Número de avaliações */
  ratingCount?: number;
  latitude?: number;
  longitude?: number;
  coverUri?: string;
  isVerified?: boolean;
  onlineStatus?: boolean;
  responseTime?: string;
  clientsServed?: number;
  foundedYear?: number;
  topBadge?: string;
  popularServices?: string;
  tags?: string;
  workingHours?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateAdminProviderInput = Omit<
  AdminProvider,
  "id" | "createdAt" | "updatedAt" | "displayOrder"
>;

const STORAGE_KEY = "@chamaja_admin_providers";

let _initialized = false;
let _providers: AdminProvider[] = [];

async function ensureLoaded(): Promise<void> {
  if (_initialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    _providers = raw ? (JSON.parse(raw) as AdminProvider[]) : [];
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

function generateId(): string {
  return `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const adminProvidersDB = {
  resetCache() {
    _initialized = false;
    _providers = [];
  },

  async getAll(): Promise<AdminProvider[]> {
    await ensureLoaded();
    return [..._providers].sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async getAllActive(): Promise<AdminProvider[]> {
    await ensureLoaded();
    return _providers
      .filter((p) => p.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  /** Retorna prestadores vinculados a um serviceId específico */
  async getByServiceId(serviceId: string): Promise<AdminProvider[]> {
    await ensureLoaded();
    return _providers
      .filter((p) => p.isActive && p.serviceId === serviceId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  /** Retorna prestadores vinculados a uma subcategoryId específica */
  async getBySubcategoryId(subcategoryId: string): Promise<AdminProvider[]> {
    await ensureLoaded();
    return _providers
      .filter(
        (p) =>
          p.isActive &&
          (p.subcategoryId === subcategoryId || p.serviceId === subcategoryId),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async create(input: CreateAdminProviderInput): Promise<AdminProvider> {
    await ensureLoaded();
    const now = new Date().toISOString();
    const provider: AdminProvider = {
      ...input,
      id: generateId(),
      displayOrder: _providers.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    _providers.push(provider);
    await persist();
    return provider;
  },

  async update(
    id: string,
    updates: Partial<Omit<AdminProvider, "id" | "createdAt">>,
  ): Promise<AdminProvider | null> {
    await ensureLoaded();
    const idx = _providers.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    _providers[idx] = {
      ..._providers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await persist();
    return _providers[idx];
  },

  async delete(id: string): Promise<boolean> {
    await ensureLoaded();
    const before = _providers.length;
    _providers = _providers.filter((p) => p.id !== id);
    if (_providers.length < before) {
      await persist();
      return true;
    }
    return false;
  },

  async toggleActive(id: string): Promise<boolean> {
    await ensureLoaded();
    const p = _providers.find((x) => x.id === id);
    if (!p) return false;
    p.isActive = !p.isActive;
    p.updatedAt = new Date().toISOString();
    await persist();
    return p.isActive;
  },

  async reorder(orderedIds: string[]): Promise<void> {
    await ensureLoaded();
    orderedIds.forEach((id, idx) => {
      const p = _providers.find((x) => x.id === id);
      if (p) p.displayOrder = idx + 1;
    });
    await persist();
  },
};
