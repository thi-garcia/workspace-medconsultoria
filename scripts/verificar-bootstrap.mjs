/**
 * ENSAIO DE BANCO LIMPO — o que vai acontecer quando o banco de produção for criado.
 *
 * Cria um banco vazio (`medconsultoria_bootstrap`), aplica APENAS `migrate deploy` + `db:seed`
 * (sem nenhum dado de exemplo), sobe o app contra ele e verifica, por HTTP real, que a aplicação
 * nasce **utilizável e vazia**:
 *   - login do ROOT funciona;
 *   - o funil de Vendas tem as 5 etapas (regressão do R2: antes elas só nasciam no demo-seed);
 *   - não há NENHUM cliente, lead, projeto ou conta fictícios.
 *
 *   pnpm verificar:bootstrap
 *
 * NUNCA escreve no `.env` e NUNCA toca no banco de desenvolvimento — usa banco e portas próprios.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BANCO = "medconsultoria_bootstrap";
const WEB_PORT = 4420;
const API_PORT = 4429;
const BASE_URL = `http://localhost:${WEB_PORT}`;
const CONTAINER = "medconsultoria-mysql";

/** Lê o `.env` da raiz sem alterá-lo nem imprimir nada dele. */
function lerEnv() {
  const out = {};
  for (const linha of readFileSync(".env", "utf8").split("\n")) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const envRaiz = lerEnv();
const urlDev = process.env.DATABASE_URL ?? envRaiz.DATABASE_URL;
if (!urlDev) throw new Error("DATABASE_URL não encontrada (.env da raiz).");
const u = new URL(urlDev);
u.pathname = `/${BANCO}`;
const DATABASE_URL = u.toString();

const ROOT_EMAIL = envRaiz.SEED_ROOT_EMAIL ?? "root@medconsultoria.com.br";
const ROOT_SENHA = envRaiz.SEED_ROOT_PASSWORD;
if (!ROOT_SENHA) throw new Error("SEED_ROOT_PASSWORD ausente no .env — sem ela não dá para provar o login.");

const filhos = [];
const falhas = [];

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32" && cmd === "pnpm",
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) throw new Error(`falhou: ${cmd} ${args.join(" ")}`);
}

function iniciar(cmd, args, extraEnv) {
  const p = spawn(cmd, args, {
    stdio: "ignore",
    shell: process.platform === "win32" && cmd === "pnpm",
    env: { ...process.env, ...extraEnv },
  });
  filhos.push(p);
}

function derrubar() {
  for (const p of filhos) {
    if (!p.pid) continue;
    try {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
      else p.kill();
    } catch {
      /* já morreu */
    }
  }
}

async function esperarSaudavel(timeoutMs = 180_000) {
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    try {
      const [web, api] = await Promise.all([
        fetch(BASE_URL).then((r) => r.ok),
        fetch(`http://localhost:${API_PORT}/health`).then((r) => r.ok),
      ]);
      if (web && api) return;
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("app do ensaio não ficou saudável");
}

function checar(descricao, ok, detalhe = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
  if (!ok) falhas.push(descricao);
}

/** Conta linhas de uma tabela do banco do ensaio, via container do MySQL. */
function contar(tabela) {
  const r = spawnSync(
    "docker",
    ["exec", CONTAINER, "mysql", "-uroot", "-proot", "-N", "-e", `SELECT COUNT(*) FROM \`${BANCO}\`.\`${tabela}\`;`],
    { encoding: "utf8" },
  );
  return Number((r.stdout || "").trim().split("\n").pop());
}

async function main() {
  console.log(`▸ ensaio de banco limpo: ${BANCO} (dev e e2e não são tocados)\n`);

  // Banco DO ZERO: para ser um ensaio honesto, precisa estar vazio. Só este banco do ensaio,
  // criado por este script, é recriado — nenhum outro é tocado.
  run("docker", [
    "exec",
    CONTAINER,
    "mysql",
    "-uroot",
    "-proot",
    "-e",
    `DROP DATABASE IF EXISTS \`${BANCO}\`; ` +
      `CREATE DATABASE \`${BANCO}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ` +
      `GRANT ALL ON \`${BANCO}\`.* TO 'medconsultoria'@'%';`,
  ]);

  const env = { DATABASE_URL };
  run("pnpm", ["--filter", "@app/db", "exec", "prisma", "migrate", "deploy"], env);
  run("pnpm", ["--filter", "@app/db", "seed"], env);
  // Repare: NENHUM `db:demo` aqui — é exatamente o que produção fará.

  const envApp = { ...env, API_PORT: String(API_PORT), WEB_PORT: String(WEB_PORT), WEB_ORIGIN: BASE_URL };
  iniciar("pnpm", ["--filter", "@app/api", "dev"], envApp);
  iniciar("pnpm", ["--filter", "@app/web", "dev"], envApp);
  await esperarSaudavel();

  console.log("\n▸ verificações no app recém-nascido:");

  // 1) Login do ROOT (a senha vem do .env e nunca é impressa).
  // O router usa superjson — o input vai embrulhado em `{ json: … }`.
  const login = await fetch(`http://localhost:${API_PORT}/trpc/auth.login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL },
    body: JSON.stringify({ json: { email: ROOT_EMAIL, password: ROOT_SENHA } }),
  });
  checar("login do ROOT funciona", login.ok, `HTTP ${login.status}`);
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];

  // 2) Funil com as 5 etapas — regressão do R2 (antes só nasciam no demo-seed).
  const etapas = contar("PipelineStage");
  checar("funil de Vendas nasce com as 5 etapas", etapas === 5, `${etapas} etapas`);

  // 3) O funil responde de verdade autenticado (não é só linha no banco).
  if (cookie) {
    const leads = await fetch(`http://localhost:${API_PORT}/trpc/leads.list`, { headers: { cookie, origin: BASE_URL } });
    checar("página Vendas responde autenticada", leads.ok, `HTTP ${leads.status}`);
  }

  // 4) Zero dado fictício.
  for (const t of ["Cliente", "Lead", "Projeto", "Conta", "Documento", "Conversa"]) {
    const n = contar(t);
    checar(`sem dado fictício em ${t}`, n === 0, `${n} registros`);
  }

  // 5) Só o ROOT existe — nenhum usuário com senha padrão do demo.
  const usuarios = contar("User");
  checar("apenas o usuário ROOT existe", usuarios === 1, `${usuarios} usuários`);

  if (falhas.length) throw new Error(`${falhas.length} verificação(ões) falharam: ${falhas.join("; ")}`);
}

main()
  .then(() => {
    derrubar();
    console.log("\n✓ banco limpo abre UTILIZÁVEL e VAZIO — ensaio de produção aprovado.");
    process.exit(0);
  })
  .catch((e) => {
    derrubar();
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  });
