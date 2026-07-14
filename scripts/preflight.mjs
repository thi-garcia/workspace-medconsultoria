#!/usr/bin/env node
/**
 * Preflight de produção — Workspace MedConsultoria.
 *
 * Roda NO SERVIDOR (TineHost/DirectAdmin) ANTES de publicar, dentro da pasta do app buildado
 * (onde existem `node_modules`, o Prisma Client gerado e o `.env` de produção). A aplicação NÃO
 * deve ser considerada compatível com o servidor até este teste passar (exit 0).
 *
 * Uso:   node scripts/preflight.mjs          (ou copiar para a raiz do bundle e rodar lá)
 *        node preflight.mjs --json           (saída em JSON)
 *
 * Baseado na STACK REAL do projeto: Node>=20, @node-rs/argon2 (com Plano B bcryptjs), uploads em
 * disco (UPLOADS_DIR), MySQL via Prisma, WebSocket (Socket.IO), OpenAI/SMTP opcionais.
 *
 * Cada verificação é CRÍTICA (bloqueia) ou AVISO (não bloqueia). Exit != 0 se alguma crítica falhar.
 */

import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, isAbsolute, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import net from "node:net";
import dns from "node:dns/promises";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, ".."); // raiz do projeto/bundle (scripts/ fica um nível abaixo)
const jsonMode = process.argv.includes("--json");

// ── carrega .env (raiz do bundle) se ainda não estiver no ambiente ──
try {
  const dotenv = await import("dotenv");
  for (const p of [resolve(RAIZ, ".env"), resolve(process.cwd(), ".env")]) {
    if (existsSync(p)) dotenv.config({ path: p });
  }
} catch {
  /* dotenv opcional — em prod as vars podem vir do painel */
}

const resultados = [];
const add = (nome, nivel, ok, detalhe) => resultados.push({ nome, nivel, ok, detalhe });
const CRIT = "critico";
const AVISO = "aviso";

// 1) Node / plataforma
{
  const maior = Number(process.versions.node.split(".")[0]);
  add("Node >= 20", CRIT, maior >= 20, `Node ${process.version} · ${process.platform}/${process.arch}`);
}

// 2) Argon2 (crítico — se falhar, login quebra em produção)
try {
  const argon = await import("@node-rs/argon2");
  const h = await argon.hash("preflight-#2026");
  const ok = h.startsWith("$argon2") && (await argon.verify(h, "preflight-#2026")) && !(await argon.verify(h, "errada"));
  add("Argon2id (hash+verify)", CRIT, ok, ok ? "binário nativo OK" : "verificação inconsistente");
} catch (e) {
  add("Argon2id (hash+verify)", CRIT, false, `NÃO carregou: ${e.message}. Ative o Plano B (bcryptjs) ou troque de plano.`);
}

// 3) Plano B bcryptjs (aviso — portabilidade)
try {
  const m = await import("bcryptjs");
  const bcrypt = m.default ?? m;
  const h = await bcrypt.hash("x", 8);
  add("Plano B bcryptjs", AVISO, await bcrypt.compare("x", h), "bcryptjs disponível");
} catch (e) {
  add("Plano B bcryptjs", AVISO, false, `indisponível: ${e.message}`);
}

// 4) UPLOADS_DIR (crítico) — absoluto em prod + escrita/leitura/remoção
{
  const dir = process.env.UPLOADS_DIR || "storage/uploads";
  const abs = resolve(process.cwd(), dir);
  const prod = process.env.NODE_ENV === "production";
  if (prod && !isAbsolute(dir)) {
    add("UPLOADS_DIR persistente", CRIT, false, `Em produção deve ser ABSOLUTO (fora do dir de deploy). Atual: "${dir}"`);
  } else {
    try {
      await mkdir(abs, { recursive: true });
      const f = resolve(abs, `.preflight-${randomUUID()}`);
      await writeFile(f, "ok");
      const lido = await readFile(f, "utf8");
      await unlink(f);
      add("UPLOADS_DIR persistente", CRIT, lido === "ok", `RW OK em ${abs}${prod ? "" : " (dev: relativo permitido)"}`);
    } catch (e) {
      add("UPLOADS_DIR persistente", CRIT, false, `Sem escrita em ${abs}: ${e.message}`);
    }
  }
}

// 5) MySQL via Prisma (crítico) + 6) migrations aplicadas
try {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.$queryRawUnsafe("SELECT 1");
  add("Conexão MySQL (Prisma)", CRIT, true, "SELECT 1 OK");
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT COUNT(*) AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL");
    const n = Number(rows?.[0]?.n ?? 0);
    add("Migrations aplicadas", CRIT, n > 0, `${n} migration(s) aplicada(s). Rode 'prisma migrate deploy' se o número divergir do bundle.`);
  } catch (e) {
    add("Migrations aplicadas", CRIT, false, `Não foi possível ler _prisma_migrations: ${e.message} (rode 'prisma migrate deploy')`);
  }
  await prisma.$disconnect();
} catch (e) {
  add("Conexão MySQL (Prisma)", CRIT, false, `Falhou: ${e.message}. Verifique DATABASE_URL.`);
}

// 7) Variáveis obrigatórias
{
  const faltando = ["DATABASE_URL", "SESSION_SECRET"].filter((k) => !process.env[k]);
  add(
    "Env obrigatórias",
    CRIT,
    faltando.length === 0,
    faltando.length ? `Faltando: ${faltando.join(", ")}` : "DATABASE_URL + SESSION_SECRET presentes",
  );
  const secret = process.env.SESSION_SECRET || "";
  add("SESSION_SECRET forte", CRIT, secret.length >= 16, `${secret.length} chars (mínimo 16)`);
  add(
    "NODE_ENV=production",
    AVISO,
    process.env.NODE_ENV === "production",
    `NODE_ENV=${process.env.NODE_ENV || "(vazio)"} — em produção deve ser 'production' (cookies secure, e-mail/CSP reais)`,
  );
}

// 8) DNS / WEB_ORIGIN
{
  const origin = process.env.WEB_ORIGIN || "";
  try {
    const host = origin ? new URL(origin).hostname : "";
    if (host && host !== "localhost") {
      await dns.lookup(host);
      add("DNS de WEB_ORIGIN", AVISO, true, `${host} resolve`);
    } else {
      add("DNS de WEB_ORIGIN", AVISO, host === "localhost", `WEB_ORIGIN=${origin || "(vazio)"}`);
    }
  } catch (e) {
    add("DNS de WEB_ORIGIN", AVISO, false, `Não resolveu: ${e.message}`);
  }
}

// helper de alcance TCP (para rede outbound)
function tcpAlcanca(host, port, timeout = 4000) {
  return new Promise((res) => {
    const s = net.connect({ host, port });
    const fim = (ok) => {
      s.destroy();
      res(ok);
    };
    s.setTimeout(timeout);
    s.once("connect", () => fim(true));
    s.once("timeout", () => fim(false));
    s.once("error", () => fim(false));
  });
}

// 9) Rede outbound: OpenAI (se chave) e SMTP (se configurado) — aviso
if (process.env.OPENAI_API_KEY) {
  add("Rede → OpenAI (api.openai.com:443)", AVISO, await tcpAlcanca("api.openai.com", 443), "necessário se a IA estiver ligada");
} else {
  add("Rede → OpenAI", AVISO, true, "IA sem chave — recurso desligado (ok)");
}
if (process.env.SMTP_HOST) {
  const port = Number(process.env.SMTP_PORT || 587);
  add(
    `Rede → SMTP (${process.env.SMTP_HOST}:${port})`,
    AVISO,
    await tcpAlcanca(process.env.SMTP_HOST, port),
    "necessário para envio de e-mail real",
  );
} else {
  add("Rede → SMTP", AVISO, true, "SMTP não configurado — e-mail em modo dev (link em tela)");
}

// 10) WebSocket/Socket.IO — verificação estrutural (o proxy precisa permitir upgrade)
add(
  "WebSocket (Socket.IO)",
  AVISO,
  true,
  "A app usa Socket.IO em /socket.io — CONFIRME no proxy (Passenger/Nginx) que o upgrade de WebSocket está habilitado. Não testável só pelo Node.",
);

// ── saída ──
const criticasFalhas = resultados.filter((r) => r.nivel === CRIT && !r.ok);
const avisos = resultados.filter((r) => r.nivel === AVISO && !r.ok);

if (jsonMode) {
  console.log(JSON.stringify({ ok: criticasFalhas.length === 0, resultados }, null, 2));
} else {
  console.log("\n╭─ PREFLIGHT — Workspace MedConsultoria ─────────────────────────────");
  for (const r of resultados) {
    const icon = r.ok ? "✅" : r.nivel === CRIT ? "❌" : "⚠️ ";
    console.log(`│ ${icon} [${r.nivel === CRIT ? "CRÍTICO" : "aviso "}] ${r.nome}\n│      ${r.detalhe}`);
  }
  console.log("╰────────────────────────────────────────────────────────────────────");
  console.log(
    criticasFalhas.length === 0
      ? `\n✅ APTO: nenhuma verificação crítica falhou.${avisos.length ? ` (${avisos.length} aviso(s) a revisar)` : ""}`
      : `\n❌ NÃO APTO: ${criticasFalhas.length} verificação(ões) crítica(s) falharam. Corrija antes de publicar.`,
  );
}

process.exit(criticasFalhas.length === 0 ? 0 : 1);
