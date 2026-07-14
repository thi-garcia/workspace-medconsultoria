import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
