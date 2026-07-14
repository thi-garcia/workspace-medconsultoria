import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@app/api/router";

/** Client tRPC tipado pelo AppRouter da API (type-safety ponta-a-ponta). */
export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

/** Tipos de saída das procedures (para tipar componentes com dados do servidor). */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
