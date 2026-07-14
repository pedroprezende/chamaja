# Implementation Plan: Dynamic Permission-Based Plan System

## Architecture Decision: Benefits Storage

**Decision: Add `key` column to existing `plan_benefits` table (NOT JSONB on plans).**

Rationale:
- The `plan_benefits` table already exists with CRUD in `PlansManagement.tsx` and `plans.ts` router
- Adding a `key` column (VARCHAR) alongside `name` is the minimum change — no table restructuring
- The admin UI benefits editor already works; we just add a `key` dropdown
- For provider-side lookups, a single JOIN query returns all benefit keys
- JSONB on plans would require rewriting all benefit CRUD and the admin editor

**Decision: On-read expiration check + hourly cron (NOT middleware).**
- Middleware on every request would add a DB query per request — too expensive
- On-read check is simple and correct: when loading provider data, check `planExpiresAt`
- Hourly cron handles bulk status transitions (Ativo → Expirado) so admin stats stay accurate

---

## Step 1: Database Schema Changes

**File: `drizzle/schema.ts`**

### 1a. Add `key` column to `plan_benefits`
```typescript
export const planBenefits = pgTable("plan_benefits", {
  id: serial("id").primaryKey(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 100 }).notNull(),   // NEW: structured benefit key
  name: varchar("name", { length: 255 }).notNull(),  // Display label (human-readable)
  displayOrder: integer("display_order").notNull().default(0),
});
```

### 1b. Add plan management fields to `providers`
```typescript
// In providers table, add:
planStatus: varchar("plan_status", { length: 50 }).default("gratuito"), 
  // "ativo" | "suspenso" | "cancelado" | "expirado" | "em_teste" | "gratuito"
planStartedAt: timestamp("plan_started_at"),  // NEW: when current plan started
```

The existing `plan`, `planId`, `billingCycle`, `lockedPrice`, `planExpiresAt` columns remain.

### 1c. Define canonical benefit keys (as a TypeScript constant, not in DB)
```typescript
// File: lib/plan-benefits.ts (NEW)
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
} as const;

export type BenefitKey = keyof typeof BENEFIT_KEYS;
```

---

## Step 2: Server-Side Helper — `getProviderBenefits()`

**File: `lib/plan-benefits.ts` (NEW)**

Core function that all consumers call:

```typescript
import { providers, plans, planBenefits } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export async function getProviderBenefits(db: any, providerId: string): Promise<Set<string>> {
  // 1. Get provider's planId and check expiration
  const [provider] = await db.select({
    planId: providers.planId,
    planExpiresAt: providers.planExpiresAt,
  }).from(providers).where(eq(providers.id, providerId)).limit(1);

  if (!provider?.planId) return new Set();
  
  // 2. Check if plan has expired
  if (provider.planExpiresAt && new Date(provider.planExpiresAt) < new Date()) {
    return new Set();  // Expired = no benefits
  }

  // 3. Get benefit keys for this plan
  const benefits = await db.select({ key: planBenefits.key })
    .from(planBenefits)
    .where(eq(planBenefits.planId, provider.planId));

  return new Set(benefits.map(b => b.key));
}

// Batch version for list queries (avoids N+1)
export async function getProvidersBenefitsMap(
  db: any, 
  providerIds: string[]
): Promise<Map<string, Set<string>>> {
  // 1. Get all providers with planId + expiry
  const providerRows = await db.select({
    id: providers.id,
    planId: providers.planId,
    planExpiresAt: providers.planExpiresAt,
  }).from(providers).where(inArray(providers.id, providerIds));

  // 2. Find non-expired providers with plans
  const now = new Date();
  const planMap = new Map<string, string>(); // providerId -> planId
  for (const row of providerRows) {
    if (row.planId && (!row.planExpiresAt || new Date(row.planExpiresAt) >= now)) {
      planMap.set(row.id, row.planId);
    }
  }

  if (planMap.size === 0) return new Map();

  // 3. Get all benefits for these plans
  const uniquePlanIds = [...new Set(planMap.values())];
  const benefits = await db.select({
    planId: planBenefits.planId,
    key: planBenefits.key,
  }).from(planBenefits).where(inArray(planBenefits.planId, uniquePlanIds));

  // 4. Build map: providerId -> Set<benefitKey>
  const planBenefitsMap = new Map<string, Set<string>>();
  for (const b of benefits) {
    if (!planBenefitsMap.has(b.planId)) planBenefitsMap.set(b.planId, new Set());
    planBenefitsMap.get(b.planId)!.add(b.key);
  }

  const result = new Map<string, Set<string>>();
  for (const [providerId, planId] of planMap) {
    result.set(providerId, planBenefitsMap.get(planId) || new Set());
  }
  return result;
}

export function hasBenefit(benefits: Set<string>, key: BenefitKey): boolean {
  return benefits.has(key);
}
```

**Performance note**: The batch function makes 2 queries total for N providers (not N+1). The result set is small (plan_benefits rows are few). For search endpoints that already select from providers, we add the planId to the select and call the batch function once.

---

## Step 3: Server Router Changes

### 3a. `server/routers/providers.ts` — Search ranking (line 725)

**Before:**
```typescript
sql`CASE WHEN ${providers.plan} IN ('premium', 'annual') THEN 1 ELSE 0 END`
```

**After:** 
Add `planId` and `planExpiresAt` to selectFields, then post-query sort:
```typescript
// In selectFields, add:
planId: providers.planId,
planExpiresAt: providers.planExpiresAt,

// After query results, use batch benefits lookup:
const benefitsMap = await getProvidersBenefitsMap(dbInstance, mapped.map(r => r.id));

// Then sort: providers with 'featured_search' benefit first
mapped.sort((a, b) => {
  const aFeatured = benefitsMap.get(a.id)?.has('featured_search') ? 1 : 0;
  const bFeatured = benefitsMap.get(b.id)?.has('featured_search') ? 1 : 0;
  return bFeatured - aFeatured || a.displayOrder - b.displayOrder;
});
```

**Alternative (simpler, SQL-only):** Use a LEFT JOIN in the query:
```typescript
// Add to selectFields:
isFeaturedSearch: sql<boolean>`EXISTS(
  SELECT 1 FROM plan_benefits pb 
  WHERE pb.plan_id = ${providers.planId} 
  AND pb.key = 'featured_search'
)`.as('is_featured_search'),

// Then in orderBy:
desc(sql`CASE WHEN ${providers.planId} IS NOT NULL 
  AND ${providers.planExpiresAt} > NOW()
  AND EXISTS(SELECT 1 FROM plan_benefits pb WHERE pb.plan_id = ${providers.planId} AND pb.key = 'featured_search')
  THEN 1 ELSE 0 END`)
```

The SQL approach avoids a second round-trip but is less readable. **Recommended: post-query sort with batch helper** for clarity.

### 3b. `server/routers/payments.ts` — Payment registration

**Before (line 66):**
```typescript
const dbPlanValue = input.plano === "mensal" ? "monthly" : "annual";
await dbInstance.update(providers).set({ plan: dbPlanValue, planExpiresAt: expiryDate });
```

**After:**
```typescript
// Accept planId in input instead of plano string
// input: { prestadorId, planId, billingCycle, valor, ... }

// 1. Look up the plan to get price for locked_price
const [plan] = await dbInstance.select().from(plans)
  .where(eq(plans.id, input.planId)).limit(1);

// 2. Update provider
await dbInstance.update(providers).set({
  planId: input.planId,
  plan: input.billingCycle === "monthly" ? "monthly" : "annual", // Keep legacy field during migration
  billingCycle: input.billingCycle,
  lockedPrice: getPriceForCycle(plan, input.billingCycle),
  planExpiresAt: expiryDate,
  planStartedAt: new Date(),
  planStatus: "ativo",
  isVerified: hasBenefitKey(plan, 'verified_badge'), // Auto-set from plan benefits
  updatedAt: new Date(),
}).where(eq(providers.id, input.prestadorId));

// 3. Insert payment record with planId
await dbInstance.insert(payments).values({
  prestadorId: input.prestadorId,
  plano: input.billingCycle === "monthly" ? "mensal" : "anual", // Keep legacy
  planId: input.planId, // NEW column on payments table
  valor: input.valor,
  ...
});
```

### 3c. `lib/mercadopago-service.ts` — Replace hardcoded plans

Replace `PAYMENT_PLANS` array with a fetch from the DB `plans` table. The component that uses this should fetch plans from `trpc.plans.list` instead.

---

## Step 4: Expiration Logic

**File: `server/expiration-cron.ts` (NEW)**

Simple hourly job that bulk-updates expired providers:

```typescript
export async function checkExpiredPlans() {
  const db = await getDb();
  if (!db) return;
  
  // Find providers with active plans that have expired
  await db.update(providers).set({
    planStatus: "expirado",
    isVerified: false, // Remove verified if plan expired
    updatedAt: new Date(),
  }).where(
    and(
      eq(providers.planStatus, "ativo"),
      lt(providers.planExpiresAt, new Date()),
    )
  );
}
```

**Trigger options:**
1. Add to existing server startup (if there's a cron system)
2. Call on first request of the day (lightweight)
3. Run via `setInterval` in the server process

**On-read fallback**: In `getProviderBenefits()`, we already check `planExpiresAt > now()` — so even without the cron, expired providers correctly get no benefits. The cron just cleans up the `planStatus` field for admin display.

---

## Step 5: Admin Panel Changes

### 5a. `admin/src/components/PlansManagement.tsx`

**Benefits editor change (line 165-185):**

Replace freeform text input with a dropdown of canonical benefit keys:

```typescript
const AVAILABLE_BENEFITS = [
  { key: "verified_badge", label: "Selo Verificado" },
  { key: "premium_badge", label: "Selo Premium" },
  { key: "featured_search", label: "Destaque na Busca" },
  { key: "featured_map", label: "Destaque no Mapa" },
  { key: "homepage_highlight", label: "Destaque na Página Inicial" },
  { key: "analytics_basic", label: "Estatísticas Básicas" },
  { key: "analytics_advanced", label: "Estatísticas Avançadas" },
  { key: "unlimited_photos", label: "Fotos Profissionais" },
  { key: "priority_support", label: "Suporte Prioritário" },
  { key: "reports", label: "Relatórios" },
  { key: "favorites_statistics", label: "Estatísticas de Favoritos" },
  { key: "real_time_statistics", label: "Estatísticas em Tempo Real" },
];
```

In the benefits list, each benefit row becomes:
```tsx
<select value={b.key} onChange={...}>
  {AVAILABLE_BENEFITS.map(opt => (
    <option value={opt.key}>{opt.label}</option>
  ))}
</select>
<input value={b.name} placeholder="Label de exibição" />
```

The `handleSave` function (line 73-147) already sends benefits as `[{ name, displayOrder }]`. Update to also send `key`:
```typescript
const benefitsPayload = currentPlan.benefits.map((b, index) => ({
  plan_id: planId,
  key: b.key,       // NEW
  name: b.name,     // Display label
  display_order: index
}));
```

### 5b. `admin/src/components/Dashboard.tsx`

**All hardcoded checks to replace:**

| Line | Current | Replacement |
|------|---------|-------------|
| 1711 | `p.plan === "monthly"` | Use `benefitsMap.get(p.id)?.has('premium_badge')` OR use `p.plan_status === 'ativo'` for revenue calc |
| 1714 | `p.plan === "annual"` | Same as above |
| 2045 | `p.plan === "monthly" \|\| p.plan === "annual"` | `p.plan_status === "ativo"` |
| 2071-2073 | Premium status filter | `p.plan_status === "ativo"` / `p.plan_status === "expirado"` |
| 2745-2746 | Same premium check | `p.plan_status === "ativo"` |
| 2785 | `p.plan === "monthly" ? "Mensal" : "Anual"` | Use `p.billing_cycle` field |
| 5463-5469 | Selected advertiser plan badge | `p.plan_status` + `p.billing_cycle` |

**Revenue calculation (line 1710-1716):**
```typescript
// Before: hardcoded prices
const mrr = monthlyActive * 10 + (annualActive * 99.9) / 12;

// After: use locked_price from each provider
const mrr = providersList
  .filter(p => p.plan_status === "ativo" && p.is_active)
  .reduce((sum, p) => {
    const monthly = p.billing_cycle === "annual" 
      ? (p.locked_price || 0) / 12 
      : (p.locked_price || 0);
    return sum + monthly;
  }, 0);
```

### 5c. `admin/src/components/DashboardHome.tsx`

Same revenue calculation fix (lines 311-325). Use `plan_status` and `locked_price`.

---

## Step 6: Mobile App Changes

### 6a. `lib/providers-database.ts`

Update `StoredProvider` interface:
```typescript
export interface StoredProvider {
  // ... existing fields ...
  plan: "monthly" | "annual" | "free" | null;  // Keep for backward compat
  planId: string | null;           // NEW
  planStatus: string | null;       // NEW: "ativo" | "suspenso" | "expirado" | etc.
  billingCycle: string | null;     // NEW
  planExpiresAt: string | null;
  benefitKeys: string[];           // NEW: flat array of benefit keys from plan
  // Remove nothing — additive change
}
```

Update `mapToStoredProvider` to include new fields.

**Critical: Where do `benefitKeys` come from?** The providers router search query (line 658-687) returns provider rows. We need to either:
1. **Option A**: Add a LEFT JOIN to plan_benefits in the search query (adds SQL complexity but single query)
2. **Option B**: Add `planId` to selectFields, then batch-fetch benefits after the query (2 queries total, cleaner)

**Recommended: Option B** — add `planId` to selectFields, then in the mapped results, call `getProvidersBenefitsMap()` and attach `benefitKeys: [...set]` to each result.

### 6b. `lib/provider-context.tsx`

**Type change (line 13):**
```typescript
// Before
export type PlanType = "monthly" | "annual" | "free" | null;

// After: keep PlanType for backward compat, add benefits
export type PlanType = "monthly" | "annual" | "free" | null;
```

**ProviderProfile interface (line 28):**
```typescript
// Add:
benefitKeys: string[];  // Canonical benefit keys from the assigned plan
```

**registerProvider (line 188-279):** Replace hardcoded expiry calculation with DB-driven:
```typescript
// Before (line 203-211):
if (plan === "monthly") { expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); }
else if (plan === "annual") { expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); }

// After: accept planId, fetch plan from DB to get billing cycle
// The checkout flow should pass planId, not a string
```

**renewPlan (line 439-454):** Same change — accept planId, fetch plan details from DB.

**PLANS constant (line 58-79):** Keep for now as fallback, but mark as `@deprecated`. Plans should be fetched from `trpc.plans.list`.

### 6c. `app/(tabs)/search.tsx` (line 1047-1051)

**Before:**
```typescript
type: typeof item.plan === "string" &&
  (item.plan.toLowerCase() === "premium" ||
   item.plan.toLowerCase() === "annual" ||
   item.plan.toLowerCase() === "monthly")
  ? "premium" : "free",
```

**After:**
```typescript
type: item.benefitKeys?.includes("premium_badge") ? "premium" : "free",
```

### 6d. `app/professionals/[category].tsx` (line 100-103)

**Before:**
```typescript
type: p.plan === "premium" || p.plan === "monthly" || p.plan === "annual"
  ? "PREMIUM" : "FREE",
```

**After:**
```typescript
type: p.benefitKeys?.includes("premium_badge") ? "PREMIUM" : "FREE",
```

### 6e. `app/admin/payments.tsx` (line 452)

**Before:**
```typescript
{prov.plan === "annual" ? "Anual" : "Mensal"}
```

**After:**
```typescript
{prov.billingCycle === "annual" ? "Anual" : prov.billingCycle === "semiannual" ? "Semestral" : prov.billingCycle === "quarterly" ? "Trimestral" : "Mensal"}
```

---

## Step 7: Web Client Changes

### 7a. `home/client/src/pages/Home.tsx`

**Line 1098:**
```typescript
// Before:
const isPremium = p.plan === "premium" || p.plan === "annual";

// After:
const isPremium = p.benefitKeys?.includes("premium_badge") || p.benefitKeys?.includes("featured_search");
```

**Line 1275:** Same pattern.

### 7b. `home/client/src/pages/Perfil.tsx` (line 564)

**Before:**
```typescript
{provider.plan === "premium" && (
  <span className="...">Parceiro</span>
)}
```

**After:**
```typescript
{provider.benefitKeys?.includes("premium_badge") && (
  <span className="...">Parceiro</span>
)}
```

### 7c. `app/(tabs)/search.tsx` — Premium badge display

Search for other `plan ===` checks in search.tsx for badge display. Replace with benefit-based checks.

---

## Step 8: Migration Strategy

### 8a. Data migration script

```sql
-- 1. Add key column to plan_benefits
ALTER TABLE plan_benefits ADD COLUMN key VARCHAR(100);

-- 2. Add new columns to providers
ALTER TABLE providers ADD COLUMN plan_status VARCHAR(50) DEFAULT 'gratuito';
ALTER TABLE providers ADD COLUMN plan_started_at TIMESTAMP;

-- 3. Add planId to payments table
ALTER TABLE pagamentos ADD COLUMN plan_id UUID;

-- 4. Backfill plan_status from existing data
UPDATE providers SET plan_status = CASE
  WHEN plan IS NOT NULL AND planExpiresAt > NOW() THEN 'ativo'
  WHEN plan IS NOT NULL AND planExpiresAt <= NOW() THEN 'expirado'
  WHEN plan IS NULL THEN 'gratuito'
  ELSE 'gratuito'
END;

-- 5. Backfill planStartedAt (use createdAt as approximation for existing data)
UPDATE providers SET plan_started_at = created_at WHERE plan IS NOT NULL;

-- 6. Migrate existing freeform benefit names to structured keys
-- (Manual mapping based on existing benefit names in plan_benefits)
UPDATE plan_benefits SET key = LOWER(REPLACE(name, ' ', '_')) 
WHERE key IS NULL;

-- 7. Update providers.isVerified based on plan benefits
UPDATE providers p
SET is_verified = EXISTS(
  SELECT 1 FROM plan_benefits pb 
  WHERE pb.plan_id = p.plan_id 
  AND pb.key = 'verified_badge'
)
WHERE p.plan_id IS NOT NULL;
```

### 8b. Backward compatibility

During migration:
- Keep `providers.plan` column — don't remove yet
- Keep `PlanType` type — all existing code continues to work
- Add `benefitKeys` as ADDITIVE field — existing consumers that don't check it still work
- The `providers.plan` string is kept for the legacy payment display and any missed checks

**Remove legacy columns AFTER all code is migrated:**
- Drop `providers.plan` (the varchar "free"/"monthly"/"annual")
- Drop `planEnum` from schema
- Remove `PlanType` type
- Remove `PLANS` constant

---

## Implementation Order (Dependency-Ordered)

### Phase 1: Foundation (no breaking changes)
1. Add `BENEFIT_KEYS` constant to `lib/plan-benefits.ts`
2. Add `key` column to `plan_benefits` in schema + migration
3. Add `planStatus`, `planStartedAt` to providers schema + migration
4. Create `getProviderBenefits()` and `getProvidersBenefitsMap()` helpers

### Phase 2: Admin panel (benefits editor)
5. Update `PlansManagement.tsx` to use structured benefit keys dropdown
6. Update `Dashboard.tsx` to use `planStatus` instead of `plan ===` checks
7. Update `DashboardHome.tsx` revenue calculation to use `lockedPrice`
8. Add plan selector to provider editing in admin

### Phase 3: Server routers
9. Update `providers.ts` search ranking to use benefit-based sort
10. Update `payments.ts` to accept `planId` and set `planStatus`
11. Add plan expiration cron/check

### Phase 4: Mobile app
12. Update `providers-database.ts` — add benefitKeys to StoredProvider
13. Update providers router to return benefitKeys in search results
14. Update `provider-context.tsx` — accept planId, fetch from DB
15. Replace all `plan ===` checks in search.tsx, professionals/[category].tsx, admin/payments.tsx

### Phase 5: Web client
16. Update Home.tsx, Perfil.tsx to use benefit-based checks
17. Replace `PAYMENT_PLANS` in mercadopago-service.ts with DB fetch

### Phase 6: Cleanup
18. Remove legacy `providers.plan` column (after all code migrated)
19. Remove `PlanType` type, `PLANS` constant, `planEnum`
20. Remove hardcoded `PAYMENT_PLANS` from mercadopago-service.ts

---

## Files Touched Summary

| File | Change Type | Phase |
|------|-------------|-------|
| `drizzle/schema.ts` | Add columns to planBenefits, providers | 1 |
| `lib/plan-benefits.ts` | NEW — benefit keys + helpers | 1 |
| `server/routers/providers.ts` | Benefit-based ranking + return benefitKeys | 3 |
| `server/routers/payments.ts` | Accept planId, set planStatus | 3 |
| `lib/mercadopago-service.ts` | Remove hardcoded PAYMENT_PLANS | 5 |
| `lib/providers-database.ts` | Add benefitKeys to StoredProvider | 4 |
| `lib/provider-context.tsx` | Accept planId, add benefitKeys | 4 |
| `app/(tabs)/search.tsx` | Replace plan string checks | 4 |
| `app/professionals/[category].tsx` | Replace plan string checks | 4 |
| `app/admin/payments.tsx` | Use billingCycle for label | 4 |
| `home/client/src/pages/Home.tsx` | Benefit-based premium check | 5 |
| `home/client/src/pages/Perfil.tsx` | Benefit-based badge check | 5 |
| `admin/src/components/PlansManagement.tsx` | Structured benefit key editor | 2 |
| `admin/src/components/Dashboard.tsx` | Use planStatus, lockedPrice | 2 |
| `admin/src/components/DashboardHome.tsx` | Revenue calc with lockedPrice | 2 |
| `server/routers/plans.ts` | Update save to handle benefit keys | 2 |
