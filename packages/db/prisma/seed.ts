import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { STAGE_DEFAULTS } from "../src/seed-config";

// Carrega o .env da raiz do monorepo.
config({ path: resolve(process.cwd(), "../../.env") });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ROOT_EMAIL ?? "root@medconsultoria.com.br";
  const senha = process.env.SEED_ROOT_PASSWORD;
  const nome = process.env.SEED_ROOT_NOME ?? "Administrador";

  if (!senha) {
    throw new Error("Defina SEED_ROOT_PASSWORD no .env antes de rodar o seed.");
  }

  const passwordHash = await hash(senha);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { nome, email, passwordHash, role: "ROOT" },
  });

  console.log(`✔ Usuário ROOT pronto: ${user.email}`);

  // Etapas do funil = CONFIG ESSENCIAL (sem elas a página Vendas nasce sem colunas).
  // Idempotente: só semeia se o pipeline estiver vazio; nunca mexe em etapas já criadas.
  const stages = await prisma.pipelineStage.count();
  if (stages === 0) {
    await prisma.pipelineStage.createMany({ data: STAGE_DEFAULTS });
    console.log(`✔ Etapas do funil criadas: ${STAGE_DEFAULTS.map((s) => s.nome).join(" → ")}`);
  } else {
    console.log(`• Etapas do funil já existem (${stages}) — mantidas.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
