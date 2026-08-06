import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    const hasAdminAccess =
      ctx.user && (ctx.user.role === "admin" || ctx.user.adminRole !== null);

    if (!hasAdminAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user!,
      },
    });
  }),
);

export const adminWriteProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    const isMasterOrWriteAdmin =
      ctx.user &&
      (ctx.user.role === "admin" ||
        (ctx.user as any).adminRole === "principal" ||
        (ctx.user as any).adminRole === "secundario");

    if (!isMasterOrWriteAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Permissão insuficiente. Requer nível Principal ou Secundário.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user!,
      },
    });
  }),
);

export const adminMasterProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    const isMasterAdmin =
      ctx.user &&
      ctx.user.role === "admin" &&
      (ctx.user as any).adminRole === "principal";

    if (!isMasterAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Acesso negado. Apenas o administrador Principal tem permissão.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user!,
      },
    });
  }),
);
