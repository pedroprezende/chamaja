import { describe, it, expect, beforeEach } from "vitest";
import {
  db,
  type DatabaseUser,
  type Commerce,
  type Professional,
} from "../lib/database-schema";

describe("Database Schema Tests", () => {
  beforeEach(() => {
    // Limpar dados antes de cada teste
    (db as any).users.clear();
    (db as any).commerces.clear();
    (db as any).professionals.clear();
  });

  describe("Users", () => {
    it("should create a user", async () => {
      const user: DatabaseUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        phone: "(11) 99999-9999",
        provider: "email",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const created = await db.createUser(user);
      expect(created.id).toBe("1");
      expect(created.email).toBe("test@example.com");
      expect(created.name).toBe("Test User");
    });

    it("should get user by id", async () => {
      const user: DatabaseUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        provider: "email",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createUser(user);
      const retrieved = await db.getUserById("1");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe("test@example.com");
    });

    it("should get user by email", async () => {
      const user: DatabaseUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        provider: "email",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createUser(user);
      const retrieved = await db.getUserByEmail("test@example.com");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Test User");
    });

    it("should update user", async () => {
      const user: DatabaseUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        provider: "email",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createUser(user);
      const updated = await db.updateUser("1", {
        name: "Updated User",
        emailVerified: true,
      });

      expect(updated?.name).toBe("Updated User");
      expect(updated?.emailVerified).toBe(true);
    });
  });

  describe("Commerces", () => {
    it("should create a commerce", async () => {
      const commerce: Commerce = {
        id: "1",
        name: "São Paulo - Centro",
        city: "São Paulo",
        state: "SP",
        address: "Avenida Paulista, 1000",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const created = await db.createCommerce(commerce);
      expect(created.id).toBe("1");
      expect(created.name).toBe("São Paulo - Centro");
      expect(created.city).toBe("São Paulo");
    });

    it("should get all active commerces", async () => {
      const commerce1: Commerce = {
        id: "1",
        name: "São Paulo - Centro",
        city: "São Paulo",
        state: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const commerce2: Commerce = {
        id: "2",
        name: "Rio de Janeiro - Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createCommerce(commerce1);
      await db.createCommerce(commerce2);

      const all = await db.getAllCommerces();
      expect(all.length).toBe(2);
    });

    it("should get commerces by city", async () => {
      const commerce1: Commerce = {
        id: "1",
        name: "São Paulo - Centro",
        city: "São Paulo",
        state: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const commerce2: Commerce = {
        id: "2",
        name: "Rio de Janeiro - Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createCommerce(commerce1);
      await db.createCommerce(commerce2);

      const spCommerces = await db.getCommercesByCity("São Paulo");
      expect(spCommerces.length).toBe(1);
      expect(spCommerces[0].name).toBe("São Paulo - Centro");
    });

    it("should delete a commerce", async () => {
      const commerce: Commerce = {
        id: "1",
        name: "São Paulo - Centro",
        city: "São Paulo",
        state: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createCommerce(commerce);
      const deleted = await db.deleteCommerce("1");
      expect(deleted).toBe(true);

      const all = await db.getAllCommerces();
      expect(all.length).toBe(0);
    });

    it("should update a commerce", async () => {
      const commerce: Commerce = {
        id: "1",
        name: "São Paulo - Centro",
        city: "São Paulo",
        state: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createCommerce(commerce);
      const updated = await db.updateCommerce("1", {
        name: "São Paulo - Vila Madalena",
      });

      expect(updated?.name).toBe("São Paulo - Vila Madalena");
    });
  });

  describe("Professionals", () => {
    it("should create a professional", async () => {
      const professional: Professional = {
        id: "1",
        userId: "user1",
        name: "João Eletricista",
        category: "Eletricista",
        city: "São Paulo",
        phone: "(11) 99999-9999",
        type: "premium",
        rating: 4.9,
        reviewCount: 128,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        approvedAt: new Date().toISOString(),
      };

      const created = await db.createProfessional(professional);
      expect(created.id).toBe("1");
      expect(created.type).toBe("premium");
      expect(created.rating).toBe(4.9);
    });

    it("should get professionals by category", async () => {
      const professional: Professional = {
        id: "1",
        userId: "user1",
        name: "João Eletricista",
        category: "Eletricista",
        city: "São Paulo",
        phone: "(11) 99999-9999",
        type: "premium",
        rating: 4.9,
        reviewCount: 128,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        approvedAt: new Date().toISOString(),
      };

      await db.createProfessional(professional);
      const electricians = await db.getProfessionalsByCategory("Eletricista");
      expect(electricians.length).toBe(1);
      expect(electricians[0].name).toBe("João Eletricista");
    });

    it("should get professionals by type", async () => {
      const premium: Professional = {
        id: "1",
        userId: "user1",
        name: "João Premium",
        category: "Eletricista",
        city: "São Paulo",
        phone: "(11) 99999-9999",
        type: "premium",
        rating: 4.9,
        reviewCount: 128,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        approvedAt: new Date().toISOString(),
      };

      const free: Professional = {
        id: "2",
        userId: "user2",
        name: "Maria Free",
        category: "Eletricista",
        city: "São Paulo",
        phone: "(11) 88888-8888",
        type: "free",
        rating: 4.5,
        reviewCount: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        approvedAt: new Date().toISOString(),
      };

      await db.createProfessional(premium);
      await db.createProfessional(free);

      const premiums = await db.getProfessionalsByType("premium");
      expect(premiums.length).toBe(1);
      expect(premiums[0].name).toBe("João Premium");
    });

    it("should approve a professional", async () => {
      const professional: Professional = {
        id: "1",
        userId: "user1",
        name: "João Eletricista",
        category: "Eletricista",
        city: "São Paulo",
        phone: "(11) 99999-9999",
        type: "free",
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await db.createProfessional(professional);
      const approved = await db.approveProfessional("1");

      expect(approved?.approvedAt).not.toBeUndefined();
    });
  });
});
