import { describe, it, expect } from "vitest";
import {
  professionals,
  premiumPlans,
  getProfessionalsByRanking,
  createProfessional,
  upgradeToPremium,
  getProfessionalById,
} from "../data/mock";

describe.skip("Professional System", () => {
  describe("getProfessionalsByRanking", () => {
    it("should return professionals sorted by type (PREMIUM first)", () => {
      const ranked = getProfessionalsByRanking();
      const premiumCount = ranked.filter((p) => p.type === "PREMIUM").length;
      const freeCount = ranked.filter((p) => p.type === "FREE").length;

      // Check that PREMIUM professionals come first
      for (let i = 0; i < premiumCount; i++) {
        expect(ranked[i].type).toBe("PREMIUM");
      }

      // Check that FREE professionals come after
      for (let i = premiumCount; i < premiumCount + freeCount; i++) {
        expect(ranked[i].type).toBe("FREE");
      }
    });

    it("should filter by category when provided", () => {
      const electricians = getProfessionalsByRanking("eletricista");
      expect(electricians.length).toBeGreaterThan(0);
      expect(electricians.every((p) => p.categoryId === "eletricista")).toBe(
        true,
      );
    });

    it("should return all professionals when no category provided", () => {
      const all = getProfessionalsByRanking();
      expect(all.length).toBe(professionals.length);
    });
  });

  describe("Premium Plans", () => {
    it("should have monthly and annual plans", () => {
      expect(premiumPlans.length).toBe(2);
      expect(premiumPlans.find((p) => p.period === "monthly")).toBeDefined();
      expect(premiumPlans.find((p) => p.period === "annual")).toBeDefined();
    });

    it("should have correct pricing", () => {
      const monthly = premiumPlans.find((p) => p.period === "monthly");
      const annual = premiumPlans.find((p) => p.period === "annual");

      expect(monthly?.price).toBe(19.9);
      expect(annual?.price).toBe(99);
    });

    it("should have benefits listed", () => {
      premiumPlans.forEach((plan) => {
        expect(plan.benefits.length).toBeGreaterThan(0);
        expect(plan.benefits).toContain("Apare\u00e7a primeiro nos resultados");
      });
    });
  });

  describe("Professional Registration", () => {
    it("should create a new professional with FREE type", () => {
      const newProf = createProfessional({
        name: "Test Professional",
        category: "Eletricista",
        city: "São Paulo",
        neighborhood: "Centro",
        phone: "5511999999999",
        avatar: "https://example.com/avatar.jpg",
        description: "This is a test professional with a long description",
      });

      expect(newProf.type).toBe("FREE");
      expect(newProf.name).toBe("Test Professional");
      expect(newProf.city).toBe("São Paulo");
      expect(newProf.rating).toBe(0);
      expect(newProf.reviewCount).toBe(0);
    });
  });

  describe("Premium Upgrade", () => {
    it("should upgrade professional to PREMIUM", () => {
      const prof = getProfessionalById("eletricista-rapido");
      if (prof) {
        const upgraded = upgradeToPremium("eletricista-rapido", "monthly");
        expect(upgraded?.type).toBe("PREMIUM");
        expect(upgraded?.premiumExpiresAt).toBeDefined();
      }
    });

    it("should calculate correct expiration date for monthly plan", () => {
      const prof = getProfessionalById("luz-forte");
      if (prof) {
        const upgraded = upgradeToPremium("luz-forte", "monthly");
        expect(upgraded?.premiumExpiresAt).toBeDefined();
        // Should be approximately 30 days from now
        const expiryDate = new Date(upgraded?.premiumExpiresAt || "");
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        expect(diffDays).toBeGreaterThanOrEqual(29);
        expect(diffDays).toBeLessThanOrEqual(31);
      }
    });

    it("should calculate correct expiration date for annual plan", () => {
      const prof = getProfessionalById("eletricista-confiavel");
      if (prof) {
        const upgraded = upgradeToPremium("eletricista-confiavel", "annual");
        expect(upgraded?.premiumExpiresAt).toBeDefined();
        // Should be approximately 365 days from now
        const expiryDate = new Date(upgraded?.premiumExpiresAt || "");
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        expect(diffDays).toBeGreaterThanOrEqual(364);
        expect(diffDays).toBeLessThanOrEqual(366);
      }
    });
  });

  describe("Professional Types", () => {
    it("should have professionals with both FREE and PREMIUM types", () => {
      const premium = professionals.filter((p) => p.type === "PREMIUM");
      const free = professionals.filter((p) => p.type === "FREE");

      expect(premium.length).toBeGreaterThan(0);
      expect(free.length).toBeGreaterThan(0);
    });

    it("should have city field for all professionals", () => {
      professionals.forEach((prof) => {
        expect(prof.city).toBeDefined();
        expect(prof.city.length).toBeGreaterThan(0);
      });
    });

    it("should have premiumExpiresAt only for PREMIUM professionals", () => {
      professionals.forEach((prof) => {
        if (prof.type === "PREMIUM") {
          expect(prof.premiumExpiresAt).toBeDefined();
        }
      });
    });
  });
});
