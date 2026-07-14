import type {} from "@fastify/cookie"; // carrega o augmentation (req.cookies, unsignCookie)
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { SessionUser } from "@app/shared";
import { SESSION_COOKIE, getUserFromSession } from "../lib/session.js";

/** Contexto de cada request: acesso a req/res + usuário autenticado (ou null). */
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Cookie assinado por @fastify/cookie; unsignCookie devolve { valid, value }.
  const raw = req.cookies[SESSION_COOKIE];
  const unsigned = raw ? req.unsignCookie(raw) : null;
  const sid = unsigned?.valid ? unsigned.value ?? undefined : undefined;

  const user: SessionUser | null = await getUserFromSession(sid);

  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
