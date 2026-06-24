import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  providers,
  services,
  featuredAds,
  whatsappClicks,
  serviceViews,
  searchQueries,
  payments,
  appEvents,
} from "../../drizzle/schema";
import { eq, desc, count, and, gt, isNotNull, ne } from "drizzle-orm";

export const dashboardRouter = router({
  getAdminStats: adminProcedure.query(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not found");

    const [providersCount] = await dbInstance
      .select({ value: count() })
      .from(providers)
      .where(eq(providers.isActive, true));

    const [adsCount] = await dbInstance
      .select({ value: count() })
      .from(featuredAds);

    const [whatsappCount] = await dbInstance
      .select({ value: count() })
      .from(whatsappClicks);

    const [viewsCount] = await dbInstance
      .select({ value: count() })
      .from(serviceViews);

    // 1. Prestadores ativos no plano mensal
    const [monthlyActiveResult] = await dbInstance
      .select({ value: count() })
      .from(providers)
      .where(
        and(
          eq(providers.plan, "monthly"),
          gt(providers.planExpiresAt, new Date()),
          eq(providers.isActive, true),
        ),
      );

    // 2. Prestadores ativos no plano anual
    const [annualActiveResult] = await dbInstance
      .select({ value: count() })
      .from(providers)
      .where(
        and(
          eq(providers.plan, "annual"),
          gt(providers.planExpiresAt, new Date()),
          eq(providers.isActive, true),
        ),
      );

    // 3. Receita Bruta Mensalizada
    const monthlyActive = monthlyActiveResult.value;
    const annualActive = annualActiveResult.value;
    const mrr = monthlyActive * 10.0 + annualActive * 12.49;

    // 4. Plaquinhas NFC pendentes (prestadores ativos do plano anual que não receberam a plaquinha)
    const activeAnnualList = await dbInstance
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          eq(providers.plan, "annual"),
          gt(providers.planExpiresAt, new Date()),
          eq(providers.isActive, true),
        ),
      );

    let pendingNfcCount = 0;
    for (const prov of activeAnnualList) {
      const latestPay = await dbInstance
        .select()
        .from(payments)
        .where(
          and(eq(payments.prestadorId, prov.id), eq(payments.plano, "anual")),
        )
        .orderBy(desc(payments.dataPagamento))
        .limit(1);

      if (latestPay.length === 0 || !latestPay[0].nfcEnviada) {
        pendingNfcCount++;
      }
    }

    // 5. Gráfico de linha - evolução mensal da Receita Bruta Mensalizada dos últimos 6 meses
    const monthsData = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      // Get the 1st day of the month
      const d = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const mStart = new Date(year, monthIndex, 1);
      const mEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

      monthsData.push({
        label: d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        start: mStart,
        end: mEnd,
        monthlySet: new Set<string>(),
        annualSet: new Set<string>(),
      });
    }

    const allPayments = await dbInstance.select().from(payments);

    for (const pay of allPayments) {
      const payStart = new Date(pay.dataPagamento);
      const payEnd = new Date(payStart);
      if (pay.plano === "mensal") {
        payEnd.setDate(payStart.getDate() + 30);
      } else {
        payEnd.setDate(payStart.getDate() + 365);
      }

      for (const m of monthsData) {
        // If payment coverage overlaps with this month's range
        if (
          payStart.getTime() <= m.end.getTime() &&
          payEnd.getTime() >= m.start.getTime()
        ) {
          if (pay.plano === "mensal") {
            m.monthlySet.add(pay.prestadorId);
          } else {
            m.annualSet.add(pay.prestadorId);
          }
        }
      }
    }

    const mrrEvolution = monthsData.map((m) => ({
      month: m.label,
      revenue: m.monthlySet.size * 10.0 + m.annualSet.size * 12.49,
    }));

    // 6. Prestadores captados via tráfego (cadastros na tabela app_events que tenham utm_source preenchido)
    const [trafficResult] = await dbInstance
      .select({ value: count() })
      .from(appEvents)
      .where(
        and(
          eq(appEvents.tipoEvento, "cadastro"),
          isNotNull(appEvents.utmSource),
          ne(appEvents.utmSource, ""),
        ),
      );

    // Get Top Service from search Queries
    const topSearches = await dbInstance
      .select({
        query: searchQueries.query,
        count: count(),
      })
      .from(searchQueries)
      .groupBy(searchQueries.query)
      .orderBy(desc(count()))
      .limit(1);

    const [totalSearchesResult] = await dbInstance
      .select({ value: count() })
      .from(searchQueries);

    let topServiceName = "Nenhum dado";
    let topServicePercentage = 0;

    if (topSearches.length > 0 && totalSearchesResult.value > 0) {
      topServiceName = topSearches[0].query;
      topServicePercentage = Math.round(
        (topSearches[0].count / totalSearchesResult.value) * 100,
      );
      topServiceName =
        topServiceName.charAt(0).toUpperCase() + topServiceName.slice(1);
    }

    // Recent activity: Combine recent providers
    const recentProviders = await dbInstance
      .select()
      .from(providers)
      .orderBy(desc(providers.createdAt))
      .limit(4);

    // Fetch the latest 5 search queries
    const recentSearches = await dbInstance
      .select()
      .from(searchQueries)
      .orderBy(desc(searchQueries.createdAt))
      .limit(5);

    return {
      stats: {
        activeProviders: providersCount.value,
        whatsappClicks: whatsappCount.value,
        serviceViews: viewsCount.value,
        activeAds: adsCount.value,
        activeMonthlyCount: monthlyActive,
        activeAnnualCount: annualActive,
        monthlyRecurringRevenue: mrr,
        pendingNfcCount: pendingNfcCount,
        trafficAcquiredCount: trafficResult.value,
        monthlyRevenueEvolution: mrrEvolution,
      },
      recentActivity: recentProviders.map((p) => ({
        id: p.id,
        title: "Novo prestador cadastrado",
        name: p.name,
        time: p.createdAt.toISOString(),
        icon: "person-add",
      })),
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        query: s.query,
        time: s.createdAt.toISOString(),
      })),
      topService: {
        name: topServiceName,
        percentage: topServicePercentage,
        icon: "search",
      },
    };
  }),
});
