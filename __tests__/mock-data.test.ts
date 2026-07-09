import { describe, it, expect } from "vitest";
import {
  categories,
  sections,
  professionals,
  getProfessionalsByService,
  getProfessionalById,
  subcategoriesByCategory,
} from "../data/mock";

describe("Mock Data", () => {
  it("deve ter categorias definidas", () => {
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
    expect(categories[0]).toHaveProperty("icon");
  });

  it("deve ter seções definidas", () => {
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]).toHaveProperty("id");
    expect(sections[0]).toHaveProperty("title");
  });

  it("deve ter subcategorias definidas por categoria", () => {
    expect(Object.keys(subcategoriesByCategory).length).toBeGreaterThan(0);
    const firstCategoryId = Object.keys(subcategoriesByCategory)[0];
    const subs = subcategoriesByCategory[firstCategoryId];
    expect(subs.length).toBeGreaterThan(0);
    expect(subs[0]).toHaveProperty("id");
    expect(subs[0]).toHaveProperty("name");
    expect(subs[0]).toHaveProperty("categoryId");
  });

  it("deve ter profissionais definidos", () => {
    expect(professionals.length).toBeGreaterThan(0);
    expect(professionals[0]).toHaveProperty("id");
    expect(professionals[0]).toHaveProperty("name");
    expect(professionals[0]).toHaveProperty("phone");
    expect(professionals[0]).toHaveProperty("rating");
  });

  it("deve filtrar profissionais por serviço", () => {
    const eletricistas = getProfessionalsByService("eletricista");
    expect(eletricistas.length).toBeGreaterThan(0);
    eletricistas.forEach((p) => expect(p.categoryId).toBe("eletricista"));
  });

  it("deve encontrar profissional por ID", () => {
    const prof = getProfessionalById("eletrica-ze");
    expect(prof).toBeDefined();
    expect(prof?.name).toBe("Elétrica do Zé");
  });

  it("deve retornar undefined para ID inexistente", () => {
    const prof = getProfessionalById("inexistente");
    expect(prof).toBeUndefined();
  });

  it("profissionais devem ter número de telefone válido", () => {
    professionals.forEach((p) => {
      expect(p.phone).toMatch(/^\d+$/);
      expect(p.phone.length).toBeGreaterThanOrEqual(10);
    });
  });
});
