import { providers, plans, planBenefits } from "../../../drizzle/schema";
import { eq, inArray, and, lt } from "drizzle-orm";

// ── Canonical benefit keys ─────────────────────────────────────────────────────
export const BENEFIT_KEYS = {
  verified_badge: "Selo Verificado",
  premium_badge: "Selo Premium",
  featured_search: "Destaque na Busca",
  featured_map: "Destaque no Mapa",
  homepage_highlight: "Destaque na Página Inicial",
  analytics_basic: "Estatísticas Básicas",
  analytics_advanced: "Estatísticas Avançadas",
  unlimited_photos: "Fotos Profissionais",
  priority_support: "Suporte Prioritário",
  reports: "Relatórios",
  favorites_statistics: "Estatísticas de Favoritos",
  real_time_statistics: "Estatísticas em Tempo Real",
  social_links: "Links de Redes Sociais",
  social_links_unlimited: "Redes Sociais Ilimitadas",
} as const;

export type BenefitKey = keyof typeof BENEFIT_KEYS;

// ── Single provider lookup ─────────────────────────────────────────────────────
export async function getProviderBenefits(
  db: any,
  providerId: string,
): Promise<Set<string>> {
  const [provider] = await db
    .select({
      planId: providers.planId,
      planExpiresAt: providers.planExpiresAt,
    })
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);

  if (!provider?.planId) return new Set();

  // Check if plan has expired
  if (provider.planExpiresAt && new Date(provider.planExpiresAt) < new Date()) {
    return new Set();
  }

  const benefits = await db
    .select({ key: planBenefits.key })
    .from(planBenefits)
    .where(eq(planBenefits.planId, provider.planId));

  return new Set(benefits.map((b: any) => b.key));
}

// ── Batch lookup (2 queries total for N providers) ─────────────────────────────
export async function getProvidersBenefitsMap(
  db: any,
  providerIds: string[],
): Promise<Map<string, Set<string>>> {
  if (providerIds.length === 0) return new Map();

  // 1. Get all providers with planId + expiry
  const providerRows = await db
    .select({
      id: providers.id,
      planId: providers.planId,
      planExpiresAt: providers.planExpiresAt,
    })
    .from(providers)
    .where(inArray(providers.id, providerIds));

  // 2. Filter non-expired providers with plans
  const now = new Date();
  const planMap = new Map<string, string>(); // providerId -> planId
  for (const row of providerRows) {
    if (
      row.planId &&
      (!row.planExpiresAt || new Date(row.planExpiresAt) >= now)
    ) {
      planMap.set(row.id, row.planId);
    }
  }

  if (planMap.size === 0) return new Map();

  // 3. Get all benefits for these plans
  const uniquePlanIds = [...new Set(planMap.values())];
  const benefits = await db
    .select({
      planId: planBenefits.planId,
      key: planBenefits.key,
    })
    .from(planBenefits)
    .where(inArray(planBenefits.planId, uniquePlanIds));

  // 4. Build map: providerId -> Set<benefitKey>
  const planBenefitsMap = new Map<string, Set<string>>();
  for (const b of benefits) {
    if (!planBenefitsMap.has(b.planId))
      planBenefitsMap.set(b.planId, new Set());
    planBenefitsMap.get(b.planId)!.add(b.key);
  }

  const result = new Map<string, Set<string>>();
  for (const [providerId, planId] of planMap) {
    result.set(providerId, planBenefitsMap.get(planId) || new Set());
  }
  return result;
}

// ── Helper to check a single benefit ───────────────────────────────────────────
export function hasBenefit(benefits: Set<string>, key: BenefitKey): boolean {
  return benefits.has(key);
}

// ── Helper to get benefit keys as array ────────────────────────────────────────
export function getBenefitKeys(benefits: Set<string>): string[] {
  return [...benefits];
}
