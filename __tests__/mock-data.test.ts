import { describe, it, expect } from "vitest";
import {
  categories,
  sections,
  services,
  professionals,
  getProfessionalsByService,
  getServicesByCategory,
  getProfessionalById,
  getSectionServices,
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

  it("deve ter serviços definidos", () => {
    expect(services.length).toBeGreaterThan(0);
    expect(services[0]).toHaveProperty("id");
    expect(services[0]).toHaveProperty("name");
    expect(services[0]).toHaveProperty("categoryId");
    expect(services[0]).toHaveProperty("image");
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

  it("deve filtrar serviços por categoria", () => {
    const reformas = getServicesByCategory("reformas-reparos");
    expect(reformas.length).toBeGreaterThan(0);
    reformas.forEach((s) => expect(s.categoryId).toBe("reformas-reparos"));
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

  it("deve retornar no máximo 3 serviços por seção", () => {
    const reformas = getSectionServices("reformas-reparos");
    expect(reformas.length).toBeLessThanOrEqual(3);
  });

  it("profissionais devem ter número de telefone válido", () => {
    professionals.forEach((p) => {
      expect(p.phone).toMatch(/^\d+$/);
      expect(p.phone.length).toBeGreaterThanOrEqual(10);
    });
  });
});
