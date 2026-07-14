import { z } from "zod";
import type {} from "@fastify/cookie"; // carrega o augmentation (setCookie/clearCookie/unsignCookie)
import {
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  aceitarConviteSchema,
  solicitarResetSchema,
  redefinirSenhaSchema,
} from "@app/shared";
import { router, publicProcedure, protectedProcedure } from "../../trpc/trpc.js";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, destroySession } from "../../lib/session.js";
import { isProd } from "../../config.js";
import {
  login,
  updateProfile,
  removerAvatar,
  changePassword,
  validarConvite,
  aceitarConvite,
  solicitarReset,
  validarReset,
  redefinirSenha,
} from "./auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  signed: true,
  maxAge: SESSION_TTL_SECONDS,
};

export const authRouter = router({
  /** Login por e-mail/senha. Define o cookie de sessão httpOnly. */
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const userAgent = ctx.req.headers["user-agent"];
    const { sid, user } = await login(input, userAgent, ctx.req.ip);
    ctx.res.setCookie(SESSION_COOKIE, sid, cookieOptions);
    return user;
  }),

  /** Encerra a sessão atual. */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const raw = ctx.req.cookies[SESSION_COOKIE];
    const unsigned = raw ? ctx.req.unsignCookie(raw) : null;
    await destroySession(unsigned?.valid ? unsigned.value ?? undefined : undefined);
    ctx.res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }),

  /** Usuário autenticado atual (ou null). Base do "estou logado?" no front. */
  me: publicProcedure.query(({ ctx }) => ctx.user),

  /** Verifica um token de convite (para a tela de definir senha). Público. */
  validarConvite: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(({ input }) => validarConvite(input.token)),

  /** Aceita o convite: define a senha e já autentica (cria o cookie de sessão). Público. */
  aceitarConvite: publicProcedure.input(aceitarConviteSchema).mutation(async ({ ctx, input }) => {
    const userAgent = ctx.req.headers["user-agent"];
    const { sid, user } = await aceitarConvite(input.token, input.novaSenha, userAgent, ctx.req.ip);
    ctx.res.setCookie(SESSION_COOKIE, sid, cookieOptions);
    return user;
  }),

  /** Solicita redefinição de senha. Sempre responde ok (anti-enumeração). Público. */
  solicitarReset: publicProcedure
    .input(solicitarResetSchema)
    .mutation(({ input }) => solicitarReset(input.email)),

  /** Verifica um token de redefinição (para a tela). Público. */
  validarReset: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(({ input }) => validarReset(input.token)),

  /** Redefine a senha via token e já autentica (cria o cookie). Público. */
  redefinirSenha: publicProcedure.input(redefinirSenhaSchema).mutation(async ({ ctx, input }) => {
    const userAgent = ctx.req.headers["user-agent"];
    const { sid, user } = await redefinirSenha(input.token, input.novaSenha, userAgent, ctx.req.ip);
    ctx.res.setCookie(SESSION_COOKIE, sid, cookieOptions);
    return user;
  }),

  /** Edita o próprio perfil (nome). */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(({ ctx, input }) => updateProfile(ctx.user.id, input.nome)),

  /** Remove a própria foto de perfil. */
  removerAvatar: protectedProcedure.mutation(({ ctx }) => removerAvatar(ctx.user.id)),

  /** Troca a própria senha (mantém a sessão atual, revoga as demais). */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(({ ctx, input }) => {
      const raw = ctx.req.cookies[SESSION_COOKIE];
      const unsigned = raw ? ctx.req.unsignCookie(raw) : null;
      const currentSid = unsigned?.valid ? unsigned.value ?? undefined : undefined;
      return changePassword(ctx.user.id, input.senhaAtual, input.novaSenha, currentSid);
    }),
});
