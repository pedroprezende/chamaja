/**
 * Sistema de banco de dados para admin
 * Gerencia contas de admin, serviços e permissões
 */

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
  description: string;
  icon?: string;
  imageUri?: string;
  showOnHome: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Banco de dados em memória (em produção, usar PostgreSQL)
const adminDatabase = {
  admins: new Map<string, AdminAccount>(),
  services: new Map<string, Service>(),
};

// Inicializar com admin pré-configurado
const initializeAdminDatabase = () => {
  const adminId = "admin-pedro";
  const existingAdmin = adminDatabase.admins.get(adminId);
  
  if (!existingAdmin) {
    const admin: AdminAccount = {
      id: adminId,
      email: "pedroprezende33@gmail.com",
      password: "3404001#Sayajins",
      name: "Pedro Prezende",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    adminDatabase.admins.set(adminId, admin);
  }
};

// Inicializar ao carregar o módulo
initializeAdminDatabase();

// Funções para Admin
export const adminDB = {
  // Admin operations
  createAdmin: async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "CONTRACTOR"
  ): Promise<AdminAccount> => {
    // Verificar se email já existe
    const existingAdmin = Array.from(adminDatabase.admins.values()).find(
      (a) => a.email === email
    );
    if (existingAdmin) {
      throw new Error("E-mail já cadastrado");
    }

    // Apenas o admin principal pode criar outros admins
    if (role === "ADMIN" && email !== "pedroprezende33@gmail.com") {
      throw new Error("Apenas o admin principal pode criar outros admins");
    }

    const id = `admin-${Date.now()}`;
    const admin: AdminAccount = {
      id,
      email,
      password,
      name,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    adminDatabase.admins.set(id, admin);
    return admin;
  },

  getAdminByEmail: async (email: string): Promise<AdminAccount | null> => {
    const admin = Array.from(adminDatabase.admins.values()).find(
      (a) => a.email === email
    );
    return admin || null;
  },

  getAdminById: async (id: string): Promise<AdminAccount | null> => {
    return adminDatabase.admins.get(id) || null;
  },

  updateAdmin: async (
    id: string,
    updates: Partial<AdminAccount>
  ): Promise<AdminAccount> => {
    const admin = adminDatabase.admins.get(id);
    if (!admin) {
      throw new Error("Admin não encontrado");
    }

    const updated: AdminAccount = {
      ...admin,
      ...updates,
      id: admin.id,
      createdAt: admin.createdAt,
      updatedAt: new Date().toISOString(),
    };

    adminDatabase.admins.set(id, updated);
    return updated;
  },

  deleteAdmin: async (id: string): Promise<void> => {
    adminDatabase.admins.delete(id);
  },

  getAllAdmins: async (): Promise<AdminAccount[]> => {
    return Array.from(adminDatabase.admins.values());
  },

  // Service operations
  createService: async (
    adminId: string,
    name: string,
    category: string,
    description: string,
    icon?: string,
    imageUri?: string,
    categoryId?: string,
    showOnHome?: boolean
  ): Promise<Service> => {
    const id = `service-${Date.now()}`;
    const service: Service = {
      id,
      adminId,
      name,
      category,
      categoryId: categoryId || "",
      description,
      icon,
      imageUri,
      showOnHome: showOnHome ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    adminDatabase.services.set(id, service);
    return service;
  },

  getServiceById: async (id: string): Promise<Service | null> => {
    return adminDatabase.services.get(id) || null;
  },

  getServicesByAdminId: async (adminId: string): Promise<Service[]> => {
    return Array.from(adminDatabase.services.values()).filter(
      (s) => s.adminId === adminId
    );
  },

  updateService: async (
    id: string,
    updates: Partial<Service>
  ): Promise<Service> => {
    const service = adminDatabase.services.get(id);
    if (!service) {
      throw new Error("Serviço não encontrado");
    }

    const updated: Service = {
      ...service,
      ...updates,
      id: service.id,
      adminId: service.adminId,
      createdAt: service.createdAt,
      updatedAt: new Date().toISOString(),
    };

    adminDatabase.services.set(id, updated);
    return updated;
  },

  deleteService: async (id: string): Promise<boolean> => {
    return adminDatabase.services.delete(id);
  },

  getAllServices: async (): Promise<Service[]> => {
    return Array.from(adminDatabase.services.values());
  },

  // Verificar permissão
  canManageService: async (
    userId: string,
    serviceId: string
  ): Promise<boolean> => {
    const user = await adminDB.getAdminById(userId);
    if (!user) return false;

    // Admin pode gerenciar todos os serviços
    if (user.role === "ADMIN") return true;

    // Contratante só pode gerenciar seus próprios serviços
    const service = await adminDB.getServiceById(serviceId);
    return service?.adminId === userId;
  },

  // Verificar se é admin principal
  isMainAdmin: async (email: string): Promise<boolean> => {
    return email === "pedroprezende33@gmail.com";
  },
};
