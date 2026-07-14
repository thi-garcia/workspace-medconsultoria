import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Cliente Socket.IO (singleton) — mesma origem; o cookie de sessão autentica o handshake. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ withCredentials: true });
  }
  return socket;
}
