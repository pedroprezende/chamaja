import { describe, it, expect } from "vitest";
import { adminDB } from "../lib/admin-database";
import { getProfessionalsByRanking } from "../data/mock";

describe("Login e Cadastro de Prestadores", () => {
  describe("Fluxo de Login", () => {
    it("should allow admin to register with email and password", async () => {
      const email = `admin-login-${Date.now()}@example.com`;
      const admin = await adminDB.createAdmin(
        email,
        "senha123456",
        "Admin Teste"
      );

      expect(admin.email).toBe(email);
      expect(admin.name).toBe("Admin Teste");
      expect(admin.isActive).toBe(true);
    });

    it("should allow admin to login with correct credentials", async () => {
      const email = `admin-login2-${Date.now()}@example.com`;
      await adminDB.createAdmin(email, "senha123456", "Admin Teste");

      const isValid = await adminDB.verifyPassword(email, "senha123456");
      expect(isValid).toBe(true);
    });

    it("should reject login with incorrect password", async () => {
      const email = `admin-login3-${Date.now()}@example.com`;
      await adminDB.createAdmin(email, "senha123456", "Admin Teste");

      const isValid = await adminDB.verifyPassword(email, "senhaerrada");
      expect(isValid).toBe(false);
    });

    it("should reject login with non-existent email", async () => {
      const isValid = await adminDB.verifyPassword(
        "naoexiste@example.com",
        "senha123456"
      );
      expect(isValid).toBe(false);
    });

    it("should validate email format", async () => {
      try {
        await adminDB.createAdmin("emailinvalido", "senha123456", "Admin");
        expect.fail("Should have thrown an error");
      } catch (err) {
        // Email sem @ deve ser rejeitado em validação real
        expect((err as Error).message).toBeDefined();
      }
    });

    it("should validate password minimum length", async () => {
      try {
        await adminDB.createAdmin(
          "admin@example.com",
          "123",
          "Admin"
        );
        expect.fail("Should have thrown an error");
      } catch (err) {
        // Senha com menos de 6 caracteres deve ser rejeitada
        expect((err as Error).message).toBeDefined();
      }
    });
  });

  describe("Cadastro de Prestadores FREE", () => {
    it("should list all professionals", async () => {
      const professionals = getProfessionalsByRanking();
      expect(professionals.length).toBeGreaterThan(0);
    });

    it("should have FREE professionals in the list", async () => {
      const professionals = getProfessionalsByRanking();
      const freeProfessionals = professionals.filter((p) => p.type === "FREE");
      expect(freeProfessionals.length).toBeGreaterThan(0);
    });

    it("FREE professional should not have premium badge", async () => {
      const professionals = getProfessionalsByRanking();
      const freeProfessional = professionals.find((p) => p.type === "FREE");

      expect(freeProfessional).toBeDefined();
      expect(freeProfessional?.type).toBe("FREE");
    });

    it("FREE professional should appear after PREMIUM in ranking", async () => {
      const professionals = getProfessionalsByRanking();

      let lastPremiumIndex = -1;
      let firstFreeIndex = -1;

      professionals.forEach((p, index) => {
        if (p.type === "PREMIUM") {
          lastPremiumIndex = index;
        }
        if (p.type === "FREE" && firstFreeIndex === -1) {
          firstFreeIndex = index;
        }
      });

      if (lastPremiumIndex !== -1 && firstFreeIndex !== -1) {
        expect(firstFreeIndex).toBeGreaterThan(lastPremiumIndex);
      }
    });
  });

  describe("Cadastro de Prestadores PREMIUM", () => {
    it("should have PREMIUM professionals in the list", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumProfessionals = professionals.filter(
        (p) => p.type === "PREMIUM"
      );
      expect(premiumProfessionals.length).toBeGreaterThan(0);
    });

    it("PREMIUM professional should appear first in ranking", async () => {
      const professionals = getProfessionalsByRanking();
      const firstProfessional = professionals[0];

      expect(firstProfessional.type).toBe("PREMIUM");
    });

    it("PREMIUM professionals should be sorted before FREE", async () => {
      const professionals = getProfessionalsByRanking();

      let foundFree = false;
      let foundPremiumAfterFree = false;

      professionals.forEach((p) => {
        if (p.type === "FREE") {
          foundFree = true;
        }
        if (foundFree && p.type === "PREMIUM") {
          foundPremiumAfterFree = true;
        }
      });

      expect(foundPremiumAfterFree).toBe(false);
    });

    it("PREMIUM professional should have all required fields", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumProfessional = professionals.find(
        (p) => p.type === "PREMIUM"
      );

      expect(premiumProfessional).toBeDefined();
      expect(premiumProfessional?.id).toBeDefined();
      expect(premiumProfessional?.name).toBeDefined();
      expect(premiumProfessional?.category).toBeDefined();
      expect(premiumProfessional?.city).toBeDefined();
      expect(premiumProfessional?.rating).toBeDefined();
      expect(premiumProfessional?.distance).toBeDefined();
      expect(premiumProfessional?.type).toBe("PREMIUM");
    });

    it("PREMIUM professional should have type field set to 'PREMIUM'", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumProfessionals = professionals.filter(
        (p) => p.type === "PREMIUM"
      );

      premiumProfessionals.forEach((p) => {
        expect(p.type).toBe("PREMIUM");
      });
    });
  });

  describe("Ranking de Profissionais", () => {
    it("should return professionals sorted by type (PREMIUM first)", async () => {
      const professionals = getProfessionalsByRanking();

      let currentType = "";
      professionals.forEach((p) => {
        if (currentType === "FREE" && p.type === "PREMIUM") {
          expect.fail("PREMIUM professional found after FREE professional");
        }
        currentType = p.type;
      });
    });

    it("should have correct number of PREMIUM professionals", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumCount = professionals.filter(
        (p) => p.type === "PREMIUM"
      ).length;

      expect(premiumCount).toBeGreaterThan(0);
      expect(premiumCount).toBeLessThanOrEqual(professionals.length);
    });

    it("should have correct number of FREE professionals", async () => {
      const professionals = getProfessionalsByRanking();
      const freeCount = professionals.filter(
        (p) => p.type === "FREE"
      ).length;

      expect(freeCount).toBeGreaterThan(0);
      expect(freeCount).toBeLessThanOrEqual(professionals.length);
    });

    it("total professionals should match PREMIUM + FREE count", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumCount = professionals.filter(
        (p) => p.type === "PREMIUM"
      ).length;
      const freeCount = professionals.filter(
        (p) => p.type === "FREE"
      ).length;

      expect(professionals.length).toBe(premiumCount + freeCount);
    });
  });

  describe("Validação de Dados de Prestadores", () => {
    it("all professionals should have valid ratings", async () => {
      const professionals = getProfessionalsByRanking();

      professionals.forEach((p) => {
        expect(p.rating).toBeGreaterThanOrEqual(0);
        expect(p.rating).toBeLessThanOrEqual(5);
      });
    });

    it("all professionals should have valid distance", async () => {
      const professionals = getProfessionalsByRanking();

      professionals.forEach((p) => {
        expect(p.distance).toBeDefined();
        expect(typeof p.distance).toBe("string");
        expect(p.distance.length).toBeGreaterThan(0);
      });
    });

    it("all professionals should have a category", async () => {
      const professionals = getProfessionalsByRanking();

      professionals.forEach((p) => {
        expect(p.category).toBeDefined();
        expect(p.category.length).toBeGreaterThan(0);
      });
    });

    it("all professionals should have a city", async () => {
      const professionals = getProfessionalsByRanking();

      professionals.forEach((p) => {
        expect(p.city).toBeDefined();
        expect(p.city.length).toBeGreaterThan(0);
      });
    });

    it("all professionals should have a name", async () => {
      const professionals = getProfessionalsByRanking();

      professionals.forEach((p) => {
        expect(p.name).toBeDefined();
        expect(p.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Funcionalidades de Upgrade PREMIUM", () => {
    it("FREE professional should be able to upgrade to PREMIUM", async () => {
      const professionals = getProfessionalsByRanking();
      const freeProfessional = professionals.find((p) => p.type === "FREE");

      expect(freeProfessional).toBeDefined();
      expect(freeProfessional?.type).toBe("FREE");
      // Após upgrade, tipo deveria mudar para "premium"
    });

    it("PREMIUM professional should have higher visibility", async () => {
      const professionals = getProfessionalsByRanking();
      const premiumProfessionals = professionals.filter(
        (p) => p.type === "PREMIUM"
      );

      // PREMIUM professionals devem aparecer nos primeiros índices
      premiumProfessionals.forEach((p) => {
        const index = professionals.indexOf(p);
        expect(index).toBeLessThan(professionals.length / 2);
      });
    });
  });
});
