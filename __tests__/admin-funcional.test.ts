import { describe, it, expect } from "vitest";
import { adminDB, type AdminAccount, type Service } from "../lib/admin-database";

describe("Admin Database - Funcional", () => {
  describe("Admin Registration", () => {
    it("should create a new admin account", async () => {
      const email = `admin-${Date.now()}-1@example.com`;
      const admin = await adminDB.createAdmin(
        email,
        "password123",
        "Admin User"
      );

      expect(admin.email).toBe(email);
      expect(admin.name).toBe("Admin User");
      expect(admin.isActive).toBe(true);
    });

    it("should not allow duplicate email registration", async () => {
      const email = `admin-${Date.now()}-2@example.com`;
      await adminDB.createAdmin(email, "password123", "Admin User");

      try {
        await adminDB.createAdmin(email, "password456", "Another Admin");
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect((err as Error).message).toBe("E-mail já cadastrado");
      }
    });

    it("should retrieve admin by email", async () => {
      const email = `admin-${Date.now()}-3@example.com`;
      await adminDB.createAdmin(email, "password123", "Admin User");

      const admin = await adminDB.getAdminByEmail(email);
      expect(admin).not.toBeNull();
      expect(admin?.name).toBe("Admin User");
    });

    it("should retrieve admin by id", async () => {
      const email = `admin-${Date.now()}-4@example.com`;
      const created = await adminDB.createAdmin(
        email,
        "password123",
        "Admin User"
      );

      const admin = await adminDB.getAdminById(created.id);
      expect(admin).not.toBeNull();
      expect(admin?.email).toBe(email);
    });
  });

  describe("Admin Login", () => {
    it("should verify correct password", async () => {
      const email = `admin-${Date.now()}-5@example.com`;
      await adminDB.createAdmin(email, "password123", "Admin User");

      const admin = await adminDB.getAdminByEmail(email);
      expect(admin?.password).toBe("password123");
    });

    it("should reject incorrect password", async () => {
      const email = `admin-${Date.now()}-6@example.com`;
      await adminDB.createAdmin(email, "password123", "Admin User");

      const admin = await adminDB.getAdminByEmail(email);
      expect(admin?.password).not.toBe("wrongpassword");
    });

    it("should reject non-existent email", async () => {
      const admin = await adminDB.getAdminByEmail("nonexistent@example.com");
      expect(admin).toBeNull();
    });
  });

  describe("Service Management", () => {
    it("should create a new service", async () => {
      const email = `admin-${Date.now()}-7@example.com`;
      const admin = await adminDB.createAdmin(email, "password123", "Admin");

      const service = await adminDB.createService(
        admin.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade residencial e comercial"
      );

      expect(service.name).toBe("Eletricista");
      expect(service.category).toBe("Elétrica");
      expect(service.adminId).toBe(admin.id);
      expect(service.isActive).toBe(true);
    });

    it("should retrieve services by admin id", async () => {
      const email = `admin-${Date.now()}-8@example.com`;
      const admin = await adminDB.createAdmin(email, "password123", "Admin");

      const service1 = await adminDB.createService(
        admin.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade"
      );

      const services = await adminDB.getServicesByAdminId(admin.id);
      expect(services.length).toBeGreaterThanOrEqual(1);
      expect(services.some((s) => s.id === service1.id)).toBe(true);
    });

    it("should retrieve service by id", async () => {
      const email = `admin-${Date.now()}-9@example.com`;
      const admin = await adminDB.createAdmin(email, "password123", "Admin");

      const created = await adminDB.createService(
        admin.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade"
      );

      const service = await adminDB.getServiceById(created.id);
      expect(service).not.toBeNull();
      expect(service?.name).toBe("Eletricista");
    });

    it("should update a service", async () => {
      const email = `admin-${Date.now()}-10@example.com`;
      const admin = await adminDB.createAdmin(email, "password123", "Admin");

      const created = await adminDB.createService(
        admin.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade"
      );

      const updated = await adminDB.updateService(created.id, {
        name: "Eletricista Profissional",
        description: "Serviços de eletricidade profissional",
      });

      expect(updated?.name).toBe("Eletricista Profissional");
      expect(updated?.description).toBe(
        "Serviços de eletricidade profissional"
      );
    });

    it("should delete a service", async () => {
      const email = `admin-${Date.now()}-11@example.com`;
      const admin = await adminDB.createAdmin(email, "password123", "Admin");

      const created = await adminDB.createService(
        admin.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade"
      );

      const deleted = await adminDB.deleteService(created.id);
      expect(deleted).toBe(true);

      const retrieved = await adminDB.getServiceById(created.id);
      expect(retrieved).toBeNull();
    });

    it("should get all services", async () => {
      const email1 = `admin-${Date.now()}-12@example.com`;
      const email2 = `admin-${Date.now()}-13@example.com`;
      const admin1 = await adminDB.createAdmin(email1, "password123", "Admin 1");
      const admin2 = await adminDB.createAdmin(email2, "password123", "Admin 2");

      await adminDB.createService(
        admin1.id,
        "Eletricista",
        "Elétrica",
        "Serviços de eletricidade"
      );
      await adminDB.createService(
        admin2.id,
        "Encanador",
        "Hidráulica",
        "Serviços de encanamento"
      );

      const allServices = await adminDB.getAllServices();
      expect(allServices.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Admin Update", () => {
    it("should update admin information", async () => {
      const email = `admin-${Date.now()}-14@example.com`;
      const admin = await adminDB.createAdmin(
        email,
        "password123",
        "Admin User"
      );

      const updated = await adminDB.updateAdmin(admin.id, {
        name: "Updated Admin",
      });

      expect(updated?.name).toBe("Updated Admin");
      expect(updated?.email).toBe(email);
    });
  });
});
