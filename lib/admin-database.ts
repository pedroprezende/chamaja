/**
 * Sistema de banco de dados para admin
 * Gerencia contas de admin, serviços e permissões
 * Persistência via AsyncStorage — dados sobrevivem ao reiniciar o app
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "ADMIN" | "CONTRACTOR";

export interface AdminAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  adminId: string;
  name: string;
  category: string;
  categoryId: string;
  /** ID da subcategoria (ex: "tatuador", "barbeiro") */
  subcategoryId?: string;
  /** Nome legível da subcategoria */
  subcategoryName?: string;
  description: string;
  icon?: string;
  imageUri?: string;
  whatsapp?: string;
  address?: string;
  gallery?: string[];
  showOnHome: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ── Chaves do AsyncStorage ──────────────────────────────────────────────────
const STORAGE_KEY_SERVICES = "@chamaja_admin_services";
const STORAGE_KEY_ADMINS   = "@chamaja_admin_accounts";

// ── Estado em memória (cache) ───────────────────────────────────────────────
let _servicesInitialized = false;
let _adminsInitialized   = false;
let _services: Service[]      = [];
let _admins:   AdminAccount[] = [];

// ── Admin padrão ────────────────────────────────────────────────────────────
const DEFAULT_ADMIN: AdminAccount = {
  id: "admin-pedro",
  email: "pedroprezende33@gmail.com",
  password: "3404001#Sayajins",
  name: "Pedro Prezende",
  role: "ADMIN",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  isActive: true,
};

// ── Helpers de persistência ─────────────────────────────────────────────────
async function ensureServicesLoaded(): Promise<void> {
  if (_servicesInitialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SERVICES);
    if (raw) {
      _services = JSON.parse(raw) as Service[];
    } else {
      _services = [];
    }
  } catch {
    _services = [];
  }
  _servicesInitialized = true;
}

async function persistServices(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(_services));
  } catch {
    // silently ignore
  }
}

async function ensureAdminsLoaded(): Promise<void> {
  if (_adminsInitialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ADMINS);
    if (raw) {
      _admins = JSON.parse(raw) as AdminAccount[];
      // Garantir que o admin principal sempre exista
      if (!_admins.find((a) => a.id === DEFAULT_ADMIN.id)) {
        _admins.unshift(DEFAULT_ADMIN);
        await persistAdmins();
      }
    } else {
      _admins = [DEFAULT_ADMIN];
      await persistAdmins();
    }
  } catch {
    _admins = [DEFAULT_ADMIN];
  }
  _adminsInitialized = true;
}

async function persistAdmins(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(_admins));
  } catch {
    // silently ignore
  }
}

// ── API pública ─────────────────────────────────────────────────────────────
export const adminDB = {
  // ── Admin operations ──────────────────────────────────────────────────────
  createAdmin: async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "CONTRACTOR"
  ): Promise<AdminAccount> => {
    await ensureAdminsLoaded();
    const existing = _admins.find((a) => a.email === email);
    if (existing) throw new Error("E-mail já cadastrado");
    if (role === "ADMIN" && email !== DEFAULT_ADMIN.email) {
      throw new Error("Apenas o admin principal pode criar outros admins");
    }
    const admin: AdminAccount = {
      id: `admin-${Date.now()}`,
      email,
      password,
      name,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    _admins.push(admin);
    await persistAdmins();
    return admin;
  },

  getAdminByEmail: async (email: string): Promise<AdminAccount | null> => {
    await ensureAdminsLoaded();
    return _admins.find((a) => a.email === email) ?? null;
  },

  getAdminById: async (id: string): Promise<AdminAccount | null> => {
    await ensureAdminsLoaded();
    return _admins.find((a) => a.id === id) ?? null;
  },

  updateAdmin: async (
    id: string,
    updates: Partial<AdminAccount>
  ): Promise<AdminAccount> => {
    await ensureAdminsLoaded();
    const idx = _admins.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Admin não encontrado");
    _admins[idx] = {
      ..._admins[idx],
      ...updates,
      id: _admins[idx].id,
      createdAt: _admins[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    await persistAdmins();
    return _admins[idx];
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await ensureAdminsLoaded();
    _admins = _admins.filter((a) => a.id !== id);
    await persistAdmins();
  },

  getAllAdmins: async (): Promise<AdminAccount[]> => {
    await ensureAdminsLoaded();
    return [..._admins];
  },

  // ── Service operations ────────────────────────────────────────────────────
  createService: async (
    adminId: string,
    name: string,
    category: string,
    description: string,
    icon?: string,
    imageUri?: string,
    categoryId?: string,
    showOnHome?: boolean,
    whatsapp?: string,
    address?: string,
    gallery?: string[],
    subcategoryId?: string,
    subcategoryName?: string
  ): Promise<Service> => {
    await ensureServicesLoaded();
    const maxOrder = _services.length > 0 ? Math.max(..._services.map((s) => s.displayOrder ?? 0)) : -1;
    const service: Service = {
      id: `service-${Date.now()}`,
      adminId,
      name,
      category,
      categoryId: categoryId || "",
      subcategoryId,
      subcategoryName,
      description,
      icon,
      imageUri,
      whatsapp,
      address,
      gallery,
      showOnHome: showOnHome ?? false,
      displayOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    _services.push(service);
    await persistServices();
    return service;
  },

  /**
   * Reordena serviços salvando a nova ordem no AsyncStorage.
   * Recebe array de IDs na ordem desejada.
   */
  reorderServices: async (orderedIds: string[]): Promise<void> => {
    await ensureServicesLoaded();
    orderedIds.forEach((id, index) => {
      const idx = _services.findIndex((s) => s.id === id);
      if (idx !== -1) {
        _services[idx] = { ..._services[idx], displayOrder: index };
      }
    });
    await persistServices();
  },

  getServiceById: async (id: string): Promise<Service | null> => {
    await ensureServicesLoaded();
    return _services.find((s) => s.id === id) ?? null;
  },

  getServicesByAdminId: async (adminId: string): Promise<Service[]> => {
    await ensureServicesLoaded();
    return _services.filter((s) => s.adminId === adminId);
  },

  updateService: async (
    id: string,
    updates: Partial<Service>
  ): Promise<Service> => {
    await ensureServicesLoaded();
    const idx = _services.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Serviço não encontrado");
    _services[idx] = {
      ..._services[idx],
      ...updates,
      id: _services[idx].id,
      adminId: _services[idx].adminId,
      createdAt: _services[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    await persistServices();
    return _services[idx];
  },

  deleteService: async (id: string): Promise<boolean> => {
    await ensureServicesLoaded();
    const before = _services.length;
    _services = _services.filter((s) => s.id !== id);
    if (_services.length < before) {
      await persistServices();
      return true;
    }
    return false;
  },

  getAllServices: async (): Promise<Service[]> => {
    await ensureServicesLoaded();
    // Garantir displayOrder nos serviços antigos que não têm o campo
    _services = _services.map((s, i) => ({
      ...s,
      displayOrder: s.displayOrder ?? i,
    }));
    return [..._services].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  },

  /**
   * Cria um serviço com ID customizado (usado para overrides de serviços mock).
   * Se já existir um serviço com esse ID, atualiza em vez de criar.
   */
  upsertServiceWithId: async (
    id: string,
    adminId: string,
    name: string,
    category: string,
    description: string,
    icon?: string,
    imageUri?: string,
    categoryId?: string,
    showOnHome?: boolean,
    whatsapp?: string
  ): Promise<Service> => {
    await ensureServicesLoaded();
    const existingIdx = _services.findIndex((s) => s.id === id);
    if (existingIdx !== -1) {
      // Atualizar existente
      _services[existingIdx] = {
        ..._services[existingIdx],
        name,
        category,
        categoryId: categoryId || "",
        description,
        icon,
        imageUri,
        whatsapp,
        showOnHome: showOnHome ?? false,
        updatedAt: new Date().toISOString(),
      };
      await persistServices();
      return _services[existingIdx];
    }
    // Criar novo com ID customizado
    const maxOrder2 = _services.length > 0 ? Math.max(..._services.map((s) => s.displayOrder ?? 0)) : -1;
    const service: Service = {
      id,
      adminId,
      name,
      category,
      categoryId: categoryId || "",
      description,
      icon,
      imageUri,
      whatsapp,
      showOnHome: showOnHome ?? false,
      displayOrder: maxOrder2 + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    _services.push(service);
    await persistServices();
    return service;
  },

  // Verificar permissão
  canManageService: async (
    userId: string,
    serviceId: string
  ): Promise<boolean> => {
    const user = await adminDB.getAdminById(userId);
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    const service = await adminDB.getServiceById(serviceId);
    return service?.adminId === userId;
  },

  isMainAdmin: async (email: string): Promise<boolean> => {
    return email === DEFAULT_ADMIN.email;
  },

  /**
   * Invalida o cache em memória para forçar releitura do AsyncStorage.
   * Útil para garantir dados frescos após reinicialização do app.
   */
  resetCache: (): void => {
    _servicesInitialized = false;
    _adminsInitialized   = false;
    _services = [];
    _admins   = [];
  },
};
