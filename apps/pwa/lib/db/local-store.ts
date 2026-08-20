/**
 * Implementação local do banco de dados usando AsyncStorage
 * Interface compatível com Supabase para troca futura
 *
 * COMO MIGRAR PARA SUPABASE:
 * 1. Em lib/db/index.ts, trocar o import de "./local-store" para "./supabase-store"
 * 2. Criar lib/db/supabase-store.ts com as mesmas funções usando o cliente Supabase
 * 3. Os dados migram via script de exportação/importação
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DbCategory,
  DbSubService,
  DbRegion,
  DbProvider,
  DbFeaturedAd,
  DbResult,
  DbListResult,
} from "./types";

// ── Chaves do AsyncStorage ────────────────────────────────────────────────────
const KEYS = {
  categories: "@chamaja_db_categories",
  sub_services: "@chamaja_db_sub_services",
  regions: "@chamaja_db_regions",
  providers: "@chamaja_db_providers",
  featured_ads: "@chamaja_db_featured_ads",
};

// ── Cache em memória ──────────────────────────────────────────────────────────
const cache: Record<string, any[] | null> = {
  categories: null,
  sub_services: null,
  regions: null,
  providers: null,
  featured_ads: null,
};

// ── Auto-inicialização (garante seed antes de qualquer leitura) ────────────────
let _initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (!_initPromise) {
    _initPromise = initDatabase();
  }
  return _initPromise;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function now() {
  return new Date().toISOString();
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function load<T>(table: keyof typeof KEYS): Promise<T[]> {
  await ensureInit();
  if (cache[table] !== null) return cache[table] as T[];
  try {
    const raw = await AsyncStorage.getItem(KEYS[table]);
    cache[table] = raw ? JSON.parse(raw) : [];
    return cache[table] as T[];
  } catch {
    return [];
  }
}

async function save<T>(table: keyof typeof KEYS, rows: T[]): Promise<void> {
  cache[table] = rows as any[];
  try {
    await AsyncStorage.setItem(KEYS[table], JSON.stringify(rows));
  } catch {}
}

// ── Dados iniciais ─────────────────────────────────────────────────────────────
const SEED_CATEGORIES: DbCategory[] = [
  {
    id: "reformas-reparos",
    name: "Reformas e Reparos",
    icon: "build",
    display_order: 1,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "assistencia-tecnica",
    name: "Assistência Técnica",
    icon: "settings",
    display_order: 2,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "servicos-domesticos",
    name: "Serviços Domésticos",
    icon: "home",
    display_order: 3,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "servicos-externos",
    name: "Serviços Externos",
    icon: "yard",
    display_order: 4,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "automotivo",
    name: "Automotivo",
    icon: "directions-car",
    display_order: 5,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "beleza-estetica",
    name: "Beleza e Estética",
    icon: "content-cut",
    display_order: 6,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "servicos-profissionais",
    name: "Serviços Profissionais",
    icon: "business-center",
    display_order: 7,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "saude",
    name: "Saúde",
    icon: "local-hospital",
    display_order: 8,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "eventos",
    name: "Eventos",
    icon: "celebration",
    display_order: 9,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "logistica",
    name: "Logística",
    icon: "local-shipping",
    display_order: 10,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "educacao",
    name: "Educação",
    icon: "school",
    display_order: 11,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "comercios",
    name: "Comércios",
    icon: "storefront",
    display_order: 12,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "mobilidade",
    name: "Mobilidade",
    icon: "commute",
    display_order: 13,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "limpeza-especializada",
    name: "Limpeza Especializada",
    icon: "cleaning-services",
    display_order: 14,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
];

const SEED_SUB_SERVICES: DbSubService[] = [
  {
    id: "eletricista",
    category_id: "reformas-reparos",
    name: "Eletricista",
    icon: "electrical-services",
    image_url:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "encanador",
    category_id: "reformas-reparos",
    name: "Encanador",
    icon: "plumbing",
    image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "pedreiro",
    category_id: "reformas-reparos",
    name: "Pedreiro",
    icon: "construction",
    image_url:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    is_active: true,
    display_order: 3,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "pintor",
    category_id: "reformas-reparos",
    name: "Pintor",
    icon: "format-paint",
    image_url:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80",
    is_active: true,
    display_order: 4,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "marceneiro",
    category_id: "reformas-reparos",
    name: "Marceneiro",
    icon: "handyman",
    image_url:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    is_active: true,
    display_order: 5,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "montagem-moveis",
    category_id: "reformas-reparos",
    name: "Montagem de Móveis",
    icon: "build",
    image_url:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    is_active: true,
    display_order: 6,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "desmontagem-moveis",
    category_id: "reformas-reparos",
    name: "Desmontagem de Móveis",
    icon: "build",
    image_url:
      "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&q=80",
    is_active: true,
    display_order: 7,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "conserto-celular",
    category_id: "assistencia-tecnica",
    name: "Conserto de Celular",
    icon: "phone-android",
    image_url:
      "https://images.unsplash.com/photo-1512428559083-a4014c209b35?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "tecnico-notebook",
    category_id: "assistencia-tecnica",
    name: "Técnico de Notebook",
    icon: "laptop",
    image_url:
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "ar-condicionado",
    category_id: "assistencia-tecnica",
    name: "Ar-condicionado",
    icon: "ac-unit",
    image_url:
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80",
    is_active: true,
    display_order: 3,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "diarista",
    category_id: "servicos-domesticos",
    name: "Diarista",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "baba",
    category_id: "servicos-domesticos",
    name: "Babá",
    icon: "child-care",
    image_url:
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "cabeleireiro",
    category_id: "beleza-estetica",
    name: "Cabeleireiro",
    icon: "content-cut",
    image_url:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "barbeiro",
    category_id: "beleza-estetica",
    name: "Barbeiro",
    icon: "face",
    image_url:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "mecanico",
    category_id: "automotivo",
    name: "Mecânico",
    icon: "car-repair",
    image_url:
      "https://images.unsplash.com/photo-1517524008410-d4484e913a2d?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "borracheiro",
    category_id: "automotivo",
    name: "Borracheiro",
    icon: "tire-repair",
    image_url:
      "https://images.unsplash.com/photo-1621905252507-b35242f8969d?w=400&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "higienizacao-sofa",
    category_id: "limpeza-especializada",
    name: "Higienização de Sofá",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    is_active: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "higienizacao-colchao",
    category_id: "limpeza-especializada",
    name: "Higienização de Colchão",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1632829871576-47b2c01950f3?w=500&q=80",
    is_active: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "limpeza-pos-obra",
    category_id: "limpeza-especializada",
    name: "Limpeza Pós-Obra",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    is_active: true,
    display_order: 3,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "limpeza-vidros",
    category_id: "limpeza-especializada",
    name: "Limpeza de Vidros",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
    is_active: true,
    display_order: 4,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "lavagem-tapetes",
    category_id: "limpeza-especializada",
    name: "Lavagem de Tapetes",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&q=80",
    is_active: true,
    display_order: 5,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "impermeabilizacao",
    category_id: "limpeza-especializada",
    name: "Impermeabilização",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    is_active: true,
    display_order: 6,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "limpeza-comercial",
    category_id: "limpeza-especializada",
    name: "Limpeza Comercial",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80",
    is_active: true,
    display_order: 7,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "limpeza-estofados",
    category_id: "limpeza-especializada",
    name: "Limpeza de Estofados",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    is_active: true,
    display_order: 8,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "sanitizacao",
    category_id: "limpeza-especializada",
    name: "Sanitização",
    icon: "cleaning-services",
    image_url:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80",
    is_active: true,
    display_order: 9,
    created_at: now(),
    updated_at: now(),
  },
];

const SEED_REGIONS: DbRegion[] = [
  {
    id: "braganca-paulista",
    name: "Bragança Paulista",
    state: "SP",
    providers_count: 128,
    ads_count: 12,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "atibaia",
    name: "Atibaia",
    state: "SP",
    providers_count: 98,
    ads_count: 8,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "extrema",
    name: "Extrema",
    state: "MG",
    providers_count: 45,
    ads_count: 4,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "itatiba",
    name: "Itatiba",
    state: "SP",
    providers_count: 62,
    ads_count: 6,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "camanducaia",
    name: "Camanducaia",
    state: "MG",
    providers_count: 28,
    ads_count: 3,
    is_active: false,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "piracaia",
    name: "Piracaia",
    state: "SP",
    providers_count: 33,
    ads_count: 2,
    is_active: true,
    created_at: now(),
    updated_at: now(),
  },
];

const SEED_FEATURED_ADS: DbFeaturedAd[] = [
  {
    id: "feat-1",
    provider_id: "p1",
    provider_name: "Elétrica do Zé",
    provider_avatar:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=80&q=70",
    category_name: "Eletricista",
    views: 1256,
    is_featured: true,
    display_order: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "feat-2",
    provider_id: "p2",
    provider_name: "Marmitaria Fit",
    provider_avatar:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&q=70",
    category_name: "Alimentação",
    views: 965,
    is_featured: true,
    display_order: 2,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "feat-3",
    provider_id: "p3",
    provider_name: "Top Barber",
    provider_avatar:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=80&q=70",
    category_name: "Barbearia",
    views: 789,
    is_featured: true,
    display_order: 3,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "feat-4",
    provider_id: "p4",
    provider_name: "Bragança Limpeza",
    provider_avatar:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=80&q=70",
    category_name: "Limpeza",
    views: 650,
    is_featured: true,
    display_order: 4,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "feat-5",
    provider_id: "p5",
    provider_name: "Studio Ink Tattoo",
    provider_avatar:
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=80&q=70",
    category_name: "Tatuador",
    views: 542,
    is_featured: true,
    display_order: 5,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "feat-6",
    provider_id: "p6",
    provider_name: "Encanador Rápido",
    provider_avatar:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&q=70",
    category_name: "Encanador",
    views: 430,
    is_featured: false,
    display_order: 6,
    created_at: now(),
    updated_at: now(),
  },
];

// ── Inicialização (seed apenas se vazio) ──────────────────────────────────────
async function seedIfEmpty<T>(
  table: keyof typeof KEYS,
  seed: T[],
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[table]);
    if (raw === null) {
      await save(table, seed);
    } else {
      const parsed = JSON.parse(raw);
      // If it's an empty array from a previous bad state, re-seed
      if (Array.isArray(parsed) && parsed.length === 0 && seed.length > 0) {
        await save(table, seed);
      } else {
        cache[table] = parsed;
      }
    }
  } catch {
    await save(table, seed);
  }
}

// ── Inicializa o banco ────────────────────────────────────────────────────────
export async function initDatabase(): Promise<void> {
  await Promise.all([
    seedIfEmpty("categories", SEED_CATEGORIES),
    seedIfEmpty("sub_services", SEED_SUB_SERVICES),
    seedIfEmpty("regions", SEED_REGIONS),
    seedIfEmpty("featured_ads", SEED_FEATURED_ADS),
  ]);
}

// ── API: Categories ───────────────────────────────────────────────────────────
export const categoriesDB = {
  async list(): Promise<DbListResult<DbCategory>> {
    try {
      const data = await load<DbCategory>("categories");
      return {
        data: data.sort((a, b) => a.display_order - b.display_order),
        error: null,
      };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  async insert(input: {
    name: string;
    icon: string;
  }): Promise<DbResult<DbCategory>> {
    try {
      const rows = await load<DbCategory>("categories");
      const maxOrder = rows.reduce((m, r) => Math.max(m, r.display_order), 0);
      const newRow: DbCategory = {
        id: uid(),
        name: input.name.trim(),
        icon: input.icon || "build",
        display_order: maxOrder + 1,
        is_active: true,
        created_at: now(),
        updated_at: now(),
      };
      await save("categories", [...rows, newRow]);
      return { data: newRow, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async update(
    id: string,
    patch: Partial<Omit<DbCategory, "id" | "created_at">>,
  ): Promise<DbResult<DbCategory>> {
    try {
      const rows = await load<DbCategory>("categories");
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { data: null, error: "Categoria não encontrada" };
      const updated: DbCategory = { ...rows[idx], ...patch, updated_at: now() };
      const next = [...rows];
      next[idx] = updated;
      await save("categories", next);
      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbCategory>("categories");
      const next = rows.filter((r) => r.id !== id);
      await save("categories", next);
      // also delete sub_services for this category
      const subs = await load<DbSubService>("sub_services");
      await save(
        "sub_services",
        subs.filter((s) => s.category_id !== id),
      );
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async reorder(ids: string[]): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbCategory>("categories");
      const updated = rows.map((r) => {
        const idx = ids.indexOf(r.id);
        return {
          ...r,
          display_order: idx !== -1 ? idx + 1 : r.display_order,
          updated_at: now(),
        };
      });
      await save("categories", updated);
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },
};

// ── API: Sub-Services ─────────────────────────────────────────────────────────
export const subServicesDB = {
  async listByCategory(
    categoryId: string,
  ): Promise<DbListResult<DbSubService>> {
    try {
      const rows = await load<DbSubService>("sub_services");
      return {
        data: rows
          .filter((r) => r.category_id === categoryId)
          .sort((a, b) => a.display_order - b.display_order),
        error: null,
      };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  async listAll(): Promise<DbListResult<DbSubService>> {
    try {
      const data = await load<DbSubService>("sub_services");
      return { data, error: null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  async insert(input: {
    category_id: string;
    name: string;
    icon?: string;
    image_url?: string;
  }): Promise<DbResult<DbSubService>> {
    try {
      const rows = await load<DbSubService>("sub_services");
      const existing = rows.filter((r) => r.category_id === input.category_id);
      const maxOrder = existing.reduce(
        (m, r) => Math.max(m, r.display_order),
        0,
      );
      const newRow: DbSubService = {
        id: uid(),
        category_id: input.category_id,
        name: input.name.trim(),
        icon: input.icon || "build",
        image_url: input.image_url ?? null,
        is_active: true,
        display_order: maxOrder + 1,
        created_at: now(),
        updated_at: now(),
      };
      await save("sub_services", [...rows, newRow]);
      return { data: newRow, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async update(
    id: string,
    patch: Partial<Omit<DbSubService, "id" | "created_at">>,
  ): Promise<DbResult<DbSubService>> {
    try {
      const rows = await load<DbSubService>("sub_services");
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { data: null, error: "Serviço não encontrado" };
      const updated: DbSubService = {
        ...rows[idx],
        ...patch,
        updated_at: now(),
      };
      const next = [...rows];
      next[idx] = updated;
      await save("sub_services", next);
      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbSubService>("sub_services");
      await save(
        "sub_services",
        rows.filter((r) => r.id !== id),
      );
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async countByCategory(): Promise<Record<string, number>> {
    const rows = await load<DbSubService>("sub_services");
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.category_id] = (acc[r.category_id] || 0) + 1;
      return acc;
    }, {});
  },
};

// ── API: Regions ──────────────────────────────────────────────────────────────
export const regionsDB = {
  async list(): Promise<DbListResult<DbRegion>> {
    try {
      const data = await load<DbRegion>("regions");
      return { data, error: null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  async insert(input: {
    name: string;
    state: string;
  }): Promise<DbResult<DbRegion>> {
    try {
      const rows = await load<DbRegion>("regions");
      const newRow: DbRegion = {
        id: uid(),
        name: input.name.trim(),
        state: (input.state || "SP").toUpperCase().slice(0, 2),
        providers_count: 0,
        ads_count: 0,
        is_active: true,
        created_at: now(),
        updated_at: now(),
      };
      await save("regions", [newRow, ...rows]);
      return { data: newRow, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async update(
    id: string,
    patch: Partial<Omit<DbRegion, "id" | "created_at">>,
  ): Promise<DbResult<DbRegion>> {
    try {
      const rows = await load<DbRegion>("regions");
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { data: null, error: "Região não encontrada" };
      const updated: DbRegion = { ...rows[idx], ...patch, updated_at: now() };
      const next = [...rows];
      next[idx] = updated;
      await save("regions", next);
      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbRegion>("regions");
      await save(
        "regions",
        rows.filter((r) => r.id !== id),
      );
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },
};

// ── API: Featured Ads ─────────────────────────────────────────────────────────
export const featuredAdsDB = {
  async list(): Promise<DbListResult<DbFeaturedAd>> {
    try {
      const data = await load<DbFeaturedAd>("featured_ads");
      return {
        data: data.sort((a, b) => a.display_order - b.display_order),
        error: null,
      };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  async toggleFeatured(id: string): Promise<DbResult<DbFeaturedAd>> {
    try {
      const rows = await load<DbFeaturedAd>("featured_ads");
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return { data: null, error: "Não encontrado" };
      const updated = {
        ...rows[idx],
        is_featured: !rows[idx].is_featured,
        updated_at: now(),
      };
      const next = [...rows];
      next[idx] = updated;
      await save("featured_ads", next);
      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async updateOrder(
    id: string,
    display_order: number,
  ): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbFeaturedAd>("featured_ads");
      const next = rows.map((r) =>
        r.id === id ? { ...r, display_order, updated_at: now() } : r,
      );
      await save("featured_ads", next);
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async insert(
    input: Omit<
      DbFeaturedAd,
      "id" | "views" | "display_order" | "created_at" | "updated_at"
    >,
  ): Promise<DbResult<DbFeaturedAd>> {
    try {
      const rows = await load<DbFeaturedAd>("featured_ads");
      const maxOrder = rows.reduce((m, r) => Math.max(m, r.display_order), 0);
      const newRow: DbFeaturedAd = {
        id: uid(),
        ...input,
        views: 0,
        display_order: maxOrder + 1,
        created_at: now(),
        updated_at: now(),
      };
      await save("featured_ads", [...rows, newRow]);
      return { data: newRow, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const rows = await load<DbFeaturedAd>("featured_ads");
      const next = rows.filter((r) => r.id !== id);
      await save("featured_ads", next);
      return { data: true, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },
};

// ── Export de utilitários ─────────────────────────────────────────────────────
export { uid, now };
