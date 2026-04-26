/**
 * Sistema de banco de dados para admin
 * Gerencia contas de admin, serviços e permissões
 */

export interface AdminAccount {
  id: string;
  email: string;
  password: string; // Em produção, usar hash bcrypt
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  adminId: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
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
    name: string
  ): Promise<AdminAccount> => {
    // Verificar se email já existe
    const existingAdmin = Array.from(adminDatabase.admins.values()).find(
      (a) => a.email === email
    );
    if (existingAdmin) {
      throw new Error("E-mail já cadastrado");
    }

    const id = `admin-${Date.now()}`;
    const admin: AdminAccount = {
      id,
      email,
      password, // Em produção, usar bcrypt.hash()
      name,
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
  ): Promise<AdminAccount | null> => {
    const admin = adminDatabase.admins.get(id);
    if (!admin) return null;

    const updated = {
      ...admin,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    adminDatabase.admins.set(id, updated);
    return updated;
  },

  verifyPassword: async (email: string, password: string): Promise<boolean> => {
    const admin = await adminDB.getAdminByEmail(email);
    if (!admin) return false;
    // Em produção, usar bcrypt.compare()
    return admin.password === password;
  },

  // Service operations
  createService: async (
    adminId: string,
    name: string,
    category: string,
    description: string,
    icon?: string
  ): Promise<Service> => {
    const id = `service-${Date.now()}`;
    const service: Service = {
      id,
      adminId,
      name,
      category,
      description,
      icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    adminDatabase.services.set(id, service);
    return service;
  },

  getServicesByAdminId: async (adminId: string): Promise<Service[]> => {
    return Array.from(adminDatabase.services.values()).filter(
      (s) => s.adminId === adminId
    );
  },

  getServiceById: async (id: string): Promise<Service | null> => {
    return adminDatabase.services.get(id) || null;
  },

  updateService: async (
    id: string,
    updates: Partial<Service>
  ): Promise<Service | null> => {
    const service = adminDatabase.services.get(id);
    if (!service) return null;

    const updated = {
      ...service,
      ...updates,
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
};
