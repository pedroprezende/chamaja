import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { servicesRouter } from "./routers/services";
import { categoriesRouter, regionsRouter } from "./routers/categories";
import { providersRouter } from "./routers/providers";
import { featuredAdsRouter } from "./routers/featuredAds";
import { dashboardRouter } from "./routers/dashboard";
import { analyticsRouter } from "./routers/analytics";
import { logsRouter } from "./routers/logs";
import { favoritesRouter } from "./routers/favorites";
import { paymentsRouter } from "./routers/payments";
import { utmRouter } from "./routers/utm";
import { plansRouter } from "./routers/plans";
import { appointmentsRouter } from "./routers/appointments";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const openId = ctx.user.openId;
      await db.deleteUserFully(openId);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  services: servicesRouter,
  categories: categoriesRouter,
  regions: regionsRouter,
  providers: providersRouter,
  featuredAds: featuredAdsRouter,
  dashboard: dashboardRouter,
  analytics: analyticsRouter,
  logs: logsRouter,
  favorites: favoritesRouter,
  payments: paymentsRouter,
  utm: utmRouter,
  plans: plansRouter,
  appointments: appointmentsRouter,
});

export type AppRouter = typeof appRouter;
