// Monta o artefato de deploy AUTO-CONTIDO em apps/api/dist/, pronto para o rsync:
//   dist/server.js      → a API bundlada (serve tRPC + Socket.IO + o SPA)
//   dist/public/        → o SPA buildado (apps/web/dist) — o server serve daqui
//   dist/prisma/        → schema + migrations (para `prisma migrate deploy`/`generate`)
//   dist/package.json   → só as deps de RUNTIME (externas), sem workspace:*
//
// Rode DEPOIS de `pnpm build`. Uso: node scripts/bundle-deploy.mjs
import { readFileSync, writeFileSync, cpSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDist = resolve(root, "apps/api/dist");

if (!existsSync(resolve(apiDist, "server.js"))) {
  console.error("✗ apps/api/dist/server.js não existe. Rode `pnpm build` primeiro.");
  process.exit(1);
}
if (!existsSync(resolve(root, "apps/web/dist/index.html"))) {
  console.error("✗ apps/web/dist não existe. Rode `pnpm build` primeiro.");
  process.exit(1);
}

// 1) SPA → dist/public
const pub = resolve(apiDist, "public");
rmSync(pub, { recursive: true, force: true });
cpSync(resolve(root, "apps/web/dist"), pub, { recursive: true });

// 2) Prisma (schema + migrations) → dist/prisma
const prismaDst = resolve(apiDist, "prisma");
rmSync(prismaDst, { recursive: true, force: true });
cpSync(resolve(root, "packages/db/prisma"), prismaDst, { recursive: true });

// 3) package.json de produção — só deps externas de runtime (sem workspace:*)
const api = JSON.parse(readFileSync(resolve(root, "apps/api/package.json"), "utf8"));
const db = JSON.parse(readFileSync(resolve(root, "packages/db/package.json"), "utf8"));
const semWorkspace = (deps) =>
  Object.fromEntries(
    Object.entries(deps ?? {}).filter(([, v]) => !String(v).startsWith("workspace:")),
  );

const dependencies = { ...semWorkspace(api.dependencies), ...semWorkspace(db.dependencies) };
// A CLI do Prisma (para migrate deploy / generate no servidor) mora nas devDeps do db.
const prismaVer = db.devDependencies?.prisma ?? db.dependencies?.prisma;
if (prismaVer) dependencies.prisma = prismaVer;

const pkg = {
  name: "workspace-medconsultoria-server",
  version: "0.0.0",
  private: true,
  type: "module",
  main: "server.js",
  engines: { node: ">=20" },
  scripts: {
    start: "node server.js",
    "prisma:generate": "prisma generate --schema=prisma/schema.prisma",
    "prisma:deploy": "prisma migrate deploy --schema=prisma/schema.prisma",
  },
  dependencies,
};
writeFileSync(resolve(apiDist, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

// 4) Startup file para o CloudLinux Passenger. O painel roda o startup via require() (CommonJS);
// como o server.js é ESM (type: module), fazemos um shim .cjs que o carrega por import() dinâmico
// (funciona em CJS) — evita ERR_REQUIRE_ESM. Aponte a "Application startup file" para `app.cjs`.
// O Passenger intercepta o `.listen()` do Fastify e gerencia a porta/socket (API_PORT é ignorado
// sob Passenger). Ver docs/DEPLOY.md §12.
const startup = `// Gerado por bundle-deploy.mjs — startup file do CloudLinux Passenger (NÃO editar à mão).
process.on("unhandledRejection", (e) => { console.error(e); process.exit(1); });
import("./server.js").catch((e) => { console.error("Falha ao iniciar server.js:", e); process.exit(1); });
`;
writeFileSync(resolve(apiDist, "app.cjs"), startup);

console.log("✓ Bundle pronto em apps/api/dist/ (server.js + public/ + prisma/ + package.json + app.cjs)");
