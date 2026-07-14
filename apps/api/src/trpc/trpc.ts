import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { hasRoleLevel, type Role } from "@app/shared";
import type { Context } from "./context.js";
import { recordCall } from "../observability/monitor.js";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const middleware = t.middleware;

// Telemetria RED: cronometra TODA chamada tRPC (rota + duração + sucesso/erro).
// Base de todos os procedures — sem instrumentar módulo por módulo.
const timed = t.procedure.use(async ({ path, next }) => {
  const start = Date.now();
  const result = await next();
  recordCall(path, result.ok, Date.now() - start);
  return result;
});

/** Sem autenticação. */
export const publicProcedure = timed;

/** Exige sessão válida; injeta `ctx.user` não-nulo. */
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
  return next({ ctx: { user: ctx.user } });
});
export const protectedProcedure = timed.use(isAuthed);

/** Exige papel com privilégio >= `min`. */
function requireRole(min: Role) {
  return middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
    if (!hasRoleLevel(ctx.user.role, min)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });
    }
    return next({ ctx: { user: ctx.user } });
  });
}

/** Acesso interno (FUNCIONARIO, ADMIN ou ROOT) — exclui CLIENTE (Portal). */
export const funcionarioProcedure = timed.use(requireRole("FUNCIONARIO"));
export const adminProcedure = timed.use(requireRole("ADMIN"));
export const rootProcedure = timed.use(requireRole("ROOT"));

/**
 * Portal do Cliente: exige papel CLIENTE e injeta `ctx.clienteId` a partir da
 * SESSÃO (nunca do input). Todo dado do portal DEVE filtrar por esse clienteId
 * — é o isolamento rígido (o cliente nunca vê dados internos nem de outros).
 */
export const portalProcedure = timed.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
    if (ctx.user.role !== "CLIENTE" || !ctx.user.clienteId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao Portal do Cliente" });
    }
    return next({ ctx: { user: ctx.user, clienteId: ctx.user.clienteId } });
  }),
);
