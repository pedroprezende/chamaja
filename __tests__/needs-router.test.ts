import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Needs and Applications tRPC Router", () => {
  it("should have all required procedures in appRouter.needs", () => {
    expect(appRouter._def.procedures).toHaveProperty("needs.create");
    expect(appRouter._def.procedures).toHaveProperty("needs.update");
    expect(appRouter._def.procedures).toHaveProperty("needs.cancel");
    expect(appRouter._def.procedures).toHaveProperty("needs.list");
    expect(appRouter._def.procedures).toHaveProperty("needs.getById");
    expect(appRouter._def.procedures).toHaveProperty("needs.applyToNeed");
    expect(appRouter._def.procedures).toHaveProperty("needs.listApplications");
    expect(appRouter._def.procedures).toHaveProperty("needs.acceptApplication");
    expect(appRouter._def.procedures).toHaveProperty("needs.rejectApplication");
    expect(appRouter._def.procedures).toHaveProperty("needs.getMyApplications");
  });

  it("should enforce authentication on protected procedures (create, update, cancel, applyToNeed, etc.)", async () => {
    const unauthenticatedCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // 1. create
    await expect(
      unauthenticatedCaller.needs.create({
        title: "Reparo elétrico",
        description: "Preciso de eletricista para instalar disjuntor",
        city: "Bragança Paulista",
        startDate: "2026-08-10",
        requiredProfessionals: 1,
        paymentType: "total",
      }),
    ).rejects.toThrow();

    // 2. update
    await expect(
      unauthenticatedCaller.needs.update({
        id: "need_test_123",
        title: "Reparo elétrico atualizado",
      }),
    ).rejects.toThrow();

    // 3. cancel
    await expect(
      unauthenticatedCaller.needs.cancel({
        id: "need_test_123",
      }),
    ).rejects.toThrow();

    // 4. applyToNeed
    await expect(
      unauthenticatedCaller.needs.applyToNeed({
        needId: "need_test_123",
        message: "Tenho disponibilidade imediata para este serviço",
      }),
    ).rejects.toThrow();

    // 5. listApplications
    await expect(
      unauthenticatedCaller.needs.listApplications({
        needId: "need_test_123",
      }),
    ).rejects.toThrow();

    // 6. acceptApplication
    await expect(
      unauthenticatedCaller.needs.acceptApplication({
        applicationId: "app_test_123",
      }),
    ).rejects.toThrow();

    // 7. rejectApplication
    await expect(
      unauthenticatedCaller.needs.rejectApplication({
        applicationId: "app_test_123",
      }),
    ).rejects.toThrow();
  });

  it("should validate createNeed payload fields correctly", async () => {
    const fakeUser = {
      id: 1,
      openId: "user_test_mock_123",
      name: "Cliente Teste",
      email: "cliente@teste.com",
      role: "user" as const,
      tipo: "cliente",
      status: "ativo",
      phone: "11999999999",
      adminRole: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    };

    const authenticatedCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: fakeUser,
    });

    // Valid combinations should not fail input schema validation (will try to hit DB)
    // Testing schema validation rejection on invalid date format:
    await expect(
      authenticatedCaller.needs.create({
        title: "Reparo de Pintura",
        description: "Preciso pintar a sala do apartamento",
        city: "Bragança Paulista",
        startDate: "invalid-date",
        requiredProfessionals: 1,
        paymentType: "total",
      }),
    ).rejects.toThrow(/Formato de data inválido/);

    // Testing schema validation rejection on short title:
    await expect(
      authenticatedCaller.needs.create({
        title: "Oi",
        description: "Preciso pintar a sala do apartamento",
        city: "Bragança Paulista",
        startDate: "2026-08-15",
        requiredProfessionals: 1,
        paymentType: "total",
      }),
    ).rejects.toThrow(/Título deve ter no mínimo 3 caracteres/);

    // Testing schema validation rejection on short description:
    await expect(
      authenticatedCaller.needs.create({
        title: "Pintura de Parede",
        description: "Curto",
        city: "Bragança Paulista",
        startDate: "2026-08-15",
        requiredProfessionals: 1,
        paymentType: "total",
      }),
    ).rejects.toThrow(/Descrição deve ter no mínimo 10 caracteres/);
  });

  it("should create a need simulating PWA publication and verify database persistence & retrieval", async () => {
    const pwaUser = {
      id: 991,
      openId: `user_pwa_${Date.now()}`,
      name: "Maria PWA",
      email: `maria.pwa.${Date.now()}@teste.com`,
      role: "user" as const,
      tipo: "cliente",
      status: "ativo",
      phone: "11988887777",
      adminRole: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    };

    // Ensure user exists in users table (foreign key constraint)
    const db = await import("../server/db");
    await db.upsertUser({
      openId: pwaUser.openId,
      name: pwaUser.name,
      email: pwaUser.email,
      loginMethod: "email",
    });

    const pwaCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: pwaUser,
    });

    const pwaPayload = {
      title: "Instalação de Chuveiro e Troca de Fiação",
      description: "Preciso de um eletricista qualificado para trocar a fiação do banheiro e instalar chuveiro 220v",
      category: "Reformas e Reparos",
      categoryId: "reformas-reparos",
      subcategoryId: "eletricista",
      subcategoryName: "Eletricista",
      requiredProfessionals: 1,
      startDate: "2026-08-15",
      endDate: "2026-08-16",
      startTime: "09:00",
      endTime: "12:00",
      budget: 180.00,
      paymentType: "total" as const,
      address: "Rua do Comércio, 123",
      neighborhood: "Centro",
      city: "Bragança Paulista",
      latitude: -22.952,
      longitude: -46.542,
      requirements: "Possuir ferramentas próprias e conhecimento em 220v",
      notes: "Interfone 101, avisar na portaria",
      photos: ["https://example.com/foto1.jpg", "https://example.com/foto2.jpg"],
    };

    const result = await pwaCaller.needs.create(pwaPayload);
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
    expect(result.id).toMatch(/^need_/);

    // Verify persistence via getById
    const fetchedNeed = await pwaCaller.needs.getById({ id: result.id });
    expect(fetchedNeed).toBeDefined();
    expect(fetchedNeed.id).toBe(result.id);
    expect(fetchedNeed.userId).toBe(pwaUser.openId);
    expect(fetchedNeed.title).toBe(pwaPayload.title);
    expect(fetchedNeed.description).toBe(pwaPayload.description);
    expect(fetchedNeed.category).toBe(pwaPayload.category);
    expect(fetchedNeed.subcategoryId).toBe(pwaPayload.subcategoryId);
    expect(fetchedNeed.subcategoryName).toBe(pwaPayload.subcategoryName);
    expect(fetchedNeed.requiredProfessionals).toBe(1);
    expect(fetchedNeed.startDate).toBe("2026-08-15");
    expect(fetchedNeed.endDate).toBe("2026-08-16");
    expect(fetchedNeed.startTime).toBe("09:00");
    expect(fetchedNeed.endTime).toBe("12:00");
    expect(Number(fetchedNeed.budget)).toBe(180.0);
    expect(fetchedNeed.paymentType).toBe("total");
    expect(fetchedNeed.city).toBe("Bragança Paulista");
    expect(fetchedNeed.neighborhood).toBe("Centro");
    expect(fetchedNeed.address).toBe("Rua do Comércio, 123");
    expect(Number(fetchedNeed.latitude)).toBeCloseTo(-22.952, 3);
    expect(Number(fetchedNeed.longitude)).toBeCloseTo(-46.542, 3);
    expect(fetchedNeed.requirements).toBe(pwaPayload.requirements);
    expect(fetchedNeed.notes).toBe(pwaPayload.notes);
    expect(fetchedNeed.photos).toEqual(pwaPayload.photos);
    expect(fetchedNeed.status).toBe("ativa");
    expect(fetchedNeed.isOwner).toBe(true);
  });

  it("should create a need simulating Web publication and verify database persistence & retrieval", async () => {
    const webUser = {
      id: 992,
      openId: `user_web_${Date.now()}`,
      name: "João Silva Web",
      email: `joao.web.${Date.now()}@teste.com`,
      role: "user" as const,
      tipo: "cliente",
      status: "ativo",
      phone: "11977776666",
      adminRole: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    };

    // Ensure user exists in users table (foreign key constraint)
    const db = await import("../server/db");
    await db.upsertUser({
      openId: webUser.openId,
      name: webUser.name,
      email: webUser.email,
      loginMethod: "email",
    });

    const webCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: webUser,
    });

    const webPayload = {
      title: "Pintura Completa da Fachada Comercial",
      description: "Contratamos 2 pintores para lixar, preparar e aplicar tinta acrílica na fachada de loja comercial",
      category: "Reformas e Reparos",
      categoryId: "reformas-reparos",
      subcategoryId: "pintor",
      subcategoryName: "Pintor",
      requiredProfessionals: 2,
      startDate: "2026-08-20",
      endDate: "2026-08-22",
      startTime: "08:00",
      endTime: "17:00",
      budget: 1200.00,
      paymentType: "diaria" as const,
      address: "Avenida Imigrantes, 500",
      neighborhood: "Lavapés",
      city: "Bragança Paulista",
      latitude: -22.948,
      longitude: -46.535,
      requirements: "Experiência prévia em pintura externa e andaime",
      notes: "Tinta e lixas fornecidas pela empresa",
      photos: ["https://example.com/fachada1.jpg"],
    };

    const result = await webCaller.needs.create(webPayload);
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
    expect(result.id).toMatch(/^need_/);

    // Verify persistence via getById
    const fetchedNeed = await webCaller.needs.getById({ id: result.id });
    expect(fetchedNeed).toBeDefined();
    expect(fetchedNeed.id).toBe(result.id);
    expect(fetchedNeed.userId).toBe(webUser.openId);
    expect(fetchedNeed.title).toBe(webPayload.title);
    expect(fetchedNeed.description).toBe(webPayload.description);
    expect(fetchedNeed.category).toBe(webPayload.category);
    expect(fetchedNeed.requiredProfessionals).toBe(2);
    expect(fetchedNeed.startDate).toBe("2026-08-20");
    expect(fetchedNeed.endDate).toBe("2026-08-22");
    expect(fetchedNeed.startTime).toBe("08:00");
    expect(fetchedNeed.endTime).toBe("17:00");
    expect(Number(fetchedNeed.budget)).toBe(1200.0);
    expect(fetchedNeed.paymentType).toBe("diaria");
    expect(fetchedNeed.city).toBe("Bragança Paulista");
    expect(fetchedNeed.neighborhood).toBe("Lavapés");
    expect(fetchedNeed.address).toBe("Avenida Imigrantes, 500");
    expect(Number(fetchedNeed.latitude)).toBeCloseTo(-22.948, 3);
    expect(Number(fetchedNeed.longitude)).toBeCloseTo(-46.535, 3);
    expect(fetchedNeed.requirements).toBe(webPayload.requirements);
    expect(fetchedNeed.notes).toBe(webPayload.notes);
    expect(fetchedNeed.photos).toEqual(webPayload.photos);
    expect(fetchedNeed.status).toBe("ativa");
    expect(fetchedNeed.isOwner).toBe(true);
  });

  it("should query needs.list with category, city, date, and budget filters and return active needs", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // 1. List all active needs
    const allActive = await caller.needs.list({
      status: "ativa",
      limit: 20,
    });
    expect(allActive).toHaveProperty("items");
    expect(Array.isArray(allActive.items)).toBe(true);
    expect(allActive.items.length).toBeGreaterThan(0);
    // Every item must be active
    allActive.items.forEach((item) => {
      expect(item.status).toBe("ativa");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("city");
      expect(item).toHaveProperty("startDate");
      expect(item).toHaveProperty("paymentType");
      expect(item).toHaveProperty("requiredProfessionals");
    });

    // 2. Filter by category
    const categoryFiltered = await caller.needs.list({
      status: "ativa",
      categoryId: "reformas-reparos",
    });
    categoryFiltered.items.forEach((item) => {
      expect(item.categoryId).toBe("reformas-reparos");
    });

    // 3. Filter by city
    const cityFiltered = await caller.needs.list({
      status: "ativa",
      city: "Bragança Paulista",
    });
    cityFiltered.items.forEach((item) => {
      expect(item.city.toLowerCase()).toContain("bragança paulista");
    });

    // 4. Test distance calculation when user coordinates are provided
    const distanceList = await caller.needs.list({
      status: "ativa",
      latitude: -22.952,
      longitude: -46.542,
      sortBy: "distance",
    });
    expect(distanceList.items.length).toBeGreaterThan(0);
    const itemWithCoords = distanceList.items.find((i) => i.latitude !== null && i.longitude !== null);
    if (itemWithCoords) {
      expect(itemWithCoords.distanceKm).toBeDefined();
      expect(typeof itemWithCoords.distanceKm).toBe("number");
      expect(itemWithCoords.distanceStr).toBeDefined();
      expect(itemWithCoords.distanceStr).toContain("de você");
    }

    // 5. Test sorting by budget descending
    const budgetSorted = await caller.needs.list({
      status: "ativa",
      sortBy: "budget_desc",
    });
    if (budgetSorted.items.length >= 2) {
      const b0 = budgetSorted.items[0].budget || 0;
      const b1 = budgetSorted.items[1].budget || 0;
      expect(Number(b0)).toBeGreaterThanOrEqual(Number(b1));
    }
  });

  it("should process professional application (Tenho interesse) and enforce business rules", async () => {
    const db = await import("../server/db");

    // Create contractor user
    const contractorOpenId = `contractor_${Date.now()}`;
    await db.upsertUser({
      openId: contractorOpenId,
      name: "Contratante Teste",
      email: `contractor.${Date.now()}@teste.com`,
      loginMethod: "email",
    });
    const contractorUser = (await db.getUserByOpenId(contractorOpenId))!;

    // Create applicant user
    const professionalOpenId = `pro_${Date.now()}`;
    await db.upsertUser({
      openId: professionalOpenId,
      name: "Profissional Candidato",
      email: `pro.${Date.now()}@teste.com`,
      loginMethod: "email",
    });
    const proUser = (await db.getUserByOpenId(professionalOpenId))!;

    const contractorCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: contractorUser,
    });

    const proCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: proUser,
    });

    // Create a need
    const newNeed = await contractorCaller.needs.create({
      title: "Pintura de Fachada Comercial",
      description: "Pintura externa de prédio comercial de 2 andares.",
      category: "Reformas e Reparos",
      categoryId: "reformas-reparos",
      requiredProfessionals: 1,
      startDate: "2026-08-30",
      budget: 850.0,
      paymentType: "total",
      city: "Bragança Paulista",
    });

    // 1. Professional applies
    const appResult = await proCaller.needs.applyToNeed({
      needId: newNeed.id,
      message: "Tenho andaime próprio e equipe para entrega rápida.",
      proposedPrice: 850.0,
      estimatedTime: "2 dias",
    });
    expect(appResult).toHaveProperty("success", true);
    expect(appResult.id).toMatch(/^app_/);

    // 2. Professional checks need details -> should have myApplication populated
    const details = await proCaller.needs.getById({ id: newNeed.id });
    expect(details.myApplication).toBeDefined();
    expect(details.myApplication?.id).toBe(appResult.id);
    expect(details.myApplication?.message).toBe("Tenho andaime próprio e equipe para entrega rápida.");
    expect(details.isOwner).toBe(false);

    // 3. Duplicate application attempt should fail
    await expect(
      proCaller.needs.applyToNeed({
        needId: newNeed.id,
        message: "Segunda tentativa",
      })
    ).rejects.toThrow("já enviou uma candidatura");

    // 4. Contractor applying to own need should fail
    await expect(
      contractorCaller.needs.applyToNeed({
        needId: newNeed.id,
        message: "Tentando minha própria vaga",
      })
    ).rejects.toThrow("própria publicação");
  });
});
