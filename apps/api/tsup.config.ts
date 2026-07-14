import { defineConfig } from "tsup";

// Bundla a API para um único dist/server.js (o deployável do DirectAdmin).
// Pacotes do workspace são embutidos; deps de node_modules (fastify, prisma, ...)
// ficam externas e são instaladas no servidor.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // @app/* são workspace (não publicados) → precisam ser embutidos.
  noExternal: ["@app/shared", "@app/db", "@app/ui"],
  // MAS o Prisma Client (CJS, com require dinâmico + engine nativo) e o argon2
  // nativo NÃO podem ser bundlados num ESM — ficam externos e são instalados no
  // servidor (`npm install` + `prisma generate`). Sem isso: "Dynamic require of fs".
  external: ["@prisma/client", ".prisma/client", "@node-rs/argon2"],
});
