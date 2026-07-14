import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@app/db";

export type TokenTipo = "CONVITE" | "RESET";

/**
 * Token público CRIPTOGRAFICAMENTE SEGURO para links sem login (assinatura de documento).
 * `randomBytes(32)` (256 bits) em base64url — imprevisível, ao contrário do `cuid`. Usado como
 * o "segredo" da URL `/assinar/{token}`. Ver decisão #2 da finalização. Registros antigos com
 * `cuid` continuam válidos (a coluna não muda); só os novos passam a usar este gerador.
 */
export function gerarTokenPublico(): string {
  return randomBytes(32).toString("base64url");
}

/** Guardamos só o hash do token no banco (o valor bruto vive apenas no link). */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Cria um token de uso único e devolve o valor BRUTO (vai no link).
 * Invalida tokens anteriores pendentes do mesmo usuário+tipo (só um ativo por vez).
 */
export async function criarToken(userId: string, tipo: TokenTipo, ttlMs: number): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.token.deleteMany({ where: { userId, tipo, usedAt: null } }),
    prisma.token.create({
      data: { tokenHash: hashToken(raw), tipo, userId, expiresAt: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return raw;
}

/** Valida SEM consumir — usado para a tela exibir de quem é o convite. */
export async function inspecionarToken(raw: string, tipo: TokenTipo): Promise<{ userId: string; nome: string; email: string } | null> {
  const token = await prisma.token.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: { select: { nome: true, email: true, deletedAt: true } } },
  });
  if (!token || token.tipo !== tipo || token.usedAt || token.expiresAt < new Date() || token.user.deletedAt) {
    return null;
  }
  return { userId: token.userId, nome: token.user.nome, email: token.user.email };
}

/** Consome o token (marca como usado, atômico) e devolve o userId — ou null se inválido. */
export async function consumirToken(raw: string, tipo: TokenTipo): Promise<string | null> {
  const token = await prisma.token.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!token || token.tipo !== tipo || token.usedAt || token.expiresAt < new Date()) return null;
  // updateMany com filtro usedAt:null garante uso único mesmo sob corrida.
  const res = await prisma.token.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return res.count === 1 ? token.userId : null;
}
