/**
 * Database Schema para XamaJá
 * Define estrutura de dados para usuários, comércios, prestadores e pagamentos
 */

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  provider: "google" | "microsoft" | "apple" | "email";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Commerce {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Professional {
  id: string;
  userId: string;
  name: string;
  category: string;
  city: string;
  commerceId?: string;
  avatar?: string;
  description?: string;
  phone: string;
  type: "free" | "premium";
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  approvedAt?: string;
}

export interface Review {
  id: string;
  professionalId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  professionalId: string;
  amount: number;
  plan: "monthly" | "annual";
  method: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "failed";
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "moderator";
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock Database Service
 * Simula operações de banco de dados com AsyncStorage
 */
export class MockDatabase {
  private users: Map<string, DatabaseUser> = new Map();
  private commerces: Map<string, Commerce> = new Map();
  private professionals: Map<string, Professional> = new Map();
  private reviews: Map<string, Review> = new Map();
  private payments: Map<string, Payment> = new Map();

  // Users
  async createUser(user: DatabaseUser): Promise<DatabaseUser> {
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<DatabaseUser | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<DatabaseUser[]> {
    return Array.from(this.users.values());
  }

  // Commerces
  async createCommerce(commerce: Commerce): Promise<Commerce> {
    this.commerces.set(commerce.id, commerce);
    return commerce;
  }

  async getCommerceById(id: string): Promise<Commerce | null> {
    return this.commerces.get(id) || null;
  }

  async getAllCommerces(): Promise<Commerce[]> {
    return Array.from(this.commerces.values()).filter((c) => c.isActive);
  }

  async updateCommerce(id: string, updates: Partial<Commerce>): Promise<Commerce | null> {
    const commerce = this.commerces.get(id);
    if (!commerce) return null;
    const updated = { ...commerce, ...updates, updatedAt: new Date().toISOString() };
    this.commerces.set(id, updated);
    return updated;
  }

  async deleteCommerce(id: string): Promise<boolean> {
    const commerce = this.commerces.get(id);
    if (!commerce) return false;
    commerce.isActive = false;
    this.commerces.set(id, commerce);
    return true;
  }

  async getCommercesByCity(city: string): Promise<Commerce[]> {
    return Array.from(this.commerces.values()).filter(
      (c) => c.city === city && c.isActive
    );
  }

  // Professionals
  async createProfessional(professional: Professional): Promise<Professional> {
    this.professionals.set(professional.id, professional);
    return professional;
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    return this.professionals.get(id) || null;
  }

  async getProfessionalsByCity(city: string): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      (p) => p.city === city && p.isActive && p.approvedAt
    );
  }

  async getProfessionalsByCategory(category: string): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      (p) => p.category === category && p.isActive && p.approvedAt
    );
  }

  async getProfessionalsByType(type: "free" | "premium"): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      (p) => p.type === type && p.isActive && p.approvedAt
    );
  }

  async updateProfessional(
    id: string,
    updates: Partial<Professional>
  ): Promise<Professional | null> {
    const professional = this.professionals.get(id);
    if (!professional) return null;
    const updated = { ...professional, ...updates, updatedAt: new Date().toISOString() };
    this.professionals.set(id, updated);
    return updated;
  }

  async approveProfessional(id: string): Promise<Professional | null> {
    return this.updateProfessional(id, { approvedAt: new Date().toISOString() });
  }

  async getPendingProfessionals(): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter((p) => !p.approvedAt);
  }

  // Reviews
  async createReview(review: Review): Promise<Review> {
    this.reviews.set(review.id, review);
    return review;
  }

  async getReviewsByProfessional(professionalId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter((r) => r.professionalId === professionalId);
  }

  // Payments
  async createPayment(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async getPaymentsByProfessional(professionalId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((p) => p.professionalId === professionalId);
  }

  async getActivePayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((p) => p.status === "approved");
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const payment = this.payments.get(id);
    if (!payment) return null;
    const updated = { ...payment, ...updates, updatedAt: new Date().toISOString() };
    this.payments.set(id, updated);
    return updated;
  }
}

// Singleton instance
export const db = new MockDatabase();
