// DEVE ser o primeiro import do server.ts — carrega o .env ANTES de qualquer
// módulo ler config/env. Tenta dois locais (o primeiro que existir vence; se
// nenhum existir, é no-op e valem as variáveis já em process.env):
//   - `.env` ao lado do artefato (produção: o server roda de dentro do dist)
//   - `../../.env` (dev: raiz do monorepo, rodando de apps/api)
// Em produção no DirectAdmin as variáveis também podem vir do painel (process.env).
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });
