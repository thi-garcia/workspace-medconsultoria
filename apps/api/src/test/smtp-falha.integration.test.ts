import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { randomBytes } from "node:crypto";

// Bloco 10 — FALHA DE SMTP (estado D), automatizado sem reinício manual do app.
// Aponta o SMTP para uma porta MORTA (ECONNREFUSED) com config "real" (host+user+pass),
// re-lendo o config/email via vi.resetModules. Confere que:
//  1) enviarEmail NÃO lança — devolve { enviado:false, erro } (o chamador cai no fallback do link);
//  2) o histórico registra status=FALHOU com o motivo (EmailEnviado.erro), e o monitor conta a falha.

const PFX = `smtpf-${randomBytes(4).toString("hex")}`;
const DEST = `${PFX}@example.test`;

const ENV_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;
const ORIG: Record<string, string | undefined> = {};

function restoreEnv() {
  for (const k of ENV_KEYS) {
    if (ORIG[k] === undefined) delete process.env[k];
    else process.env[k] = ORIG[k];
  }
}

beforeAll(() => {
  for (const k of ENV_KEYS) ORIG[k] = process.env[k];
  expect(process.env.DATABASE_URL).toContain("_test");
});

afterEach(() => {
  vi.resetModules();
  restoreEnv();
});

afterAll(async () => {
  restoreEnv();
  vi.resetModules();
  const { prisma } = await import("@app/db");
  await prisma.emailEnviado.deleteMany({ where: { para: DEST } });
  await prisma.$disconnect();
});

describe("SMTP — falha de envio (estado D)", () => {
  it("SMTP para porta morta: enviarEmail devolve { enviado:false, erro } sem lançar", async () => {
    vi.resetModules();
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "59999"; // porta fechada → ECONNREFUSED imediato
    process.env.SMTP_USER = "test@dead.local";
    process.env.SMTP_PASS = "x";
    process.env.SMTP_FROM = "MedConsultoria <no-reply@medconsultoria.com.br>";

    const { isEmailReal } = await import("../config.js");
    expect(isEmailReal, "config completo → modo real (tenta enviar de verdade)").toBe(true);

    const { enviarEmail } = await import("../lib/email.js");
    const r = await enviarEmail({ para: DEST, assunto: "Teste de falha", html: "<p>oi</p>", texto: "oi" });
    expect(r.enviado).toBe(false);
    expect(r.erro, "o motivo da falha é preservado (ex.: ECONNREFUSED)").toBeTruthy();
  });

  it("histórico registra a falha (status=FALHOU + erro) e o monitor a contabiliza", async () => {
    vi.resetModules();
    const { prisma } = await import("@app/db");
    const { registrarEmailEnviado, resumoEnviados } = await import("../modules/emails/enviados.service.js");

    const antes = await resumoEnviados();
    await registrarEmailEnviado(DEST, "Assunto teste", "corpo do e-mail", null, false, "connect ECONNREFUSED 127.0.0.1:59999");

    const row = await prisma.emailEnviado.findFirst({ where: { para: DEST }, orderBy: { createdAt: "desc" } });
    expect(row?.status).toBe("FALHOU");
    expect(row?.erro).toContain("ECONNREFUSED");

    const depois = await resumoEnviados();
    expect(depois.falhas7d).toBe(antes.falhas7d + 1);
  });
});
