import type {} from "@fastify/cookie"; // carrega o augmentation (parseCookie/unsignCookie na instância)
import { Server } from "socket.io";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { SESSION_COOKIE, getUserFromSession } from "../lib/session.js";

let io: Server | null = null;

/**
 * Inicializa o Socket.IO no mesmo servidor HTTP do Fastify.
 * Autentica no handshake reutilizando o cookie de sessão; cada usuário entra
 * na room `user:<id>` para receber notificações direcionadas.
 */
export function initRealtime(app: FastifyInstance): Server {
  io = new Server(app.server, {
    cors: { origin: config.WEB_ORIGIN, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const parsed = app.parseCookie(cookieHeader);
      const raw = parsed[SESSION_COOKIE];
      const unsigned = raw ? app.unsignCookie(raw) : null;
      const sid = unsigned?.valid ? unsigned.value ?? undefined : undefined;

      const user = await getUserFromSession(sid);
      if (!user) return next(new Error("unauthorized"));

      socket.data.userId = user.id;
      await socket.join(`user:${user.id}`);
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  return io;
}

/** Empurra eventos em tempo real. Base para notificações (e, na Fase 6, chat). */
export const notificationService = {
  emitToUser(userId: string, event: string, payload: unknown): void {
    io?.to(`user:${userId}`).emit(event, payload);
  },
};

/** Número de clientes Socket.IO conectados agora (para o painel de Sistema). */
export function contarConexoesSocket(): number {
  return io?.engine.clientsCount ?? 0;
}
