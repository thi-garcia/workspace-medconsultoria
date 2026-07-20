/**
 * Fixtures DETERMINÍSTICAS para a suíte E2E (roda antes dos specs, com `node` — SEM tsx, para
 * funcionar na CI apenas com `pnpm install --frozen-lockfile`). Idempotente e portável
 * (lookup do cliente por e-mail, não por id fixo):
 *   1) Briefing (ServicoRequisito BRIEFING + Formulario com 1 campo por tipo) ligado ao cliente do Portal;
 *   2) Reset de senha (usuário descartável + tokens RESET válido/expirado), escrevendo os RAW em
 *      e2e/.auth/fixtures.json para o spec (o banco só guarda o hash sha256).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Carrega DATABASE_URL do .env da raiz (o processo do Playwright/CI não a tem por padrão).
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const prisma = new PrismaClient();

const PORTAL_EMAIL = "cliente@medconsultoria.com.br";
const REQ_ID = "e2ereqbrief00000000000000";
const FORM_ID = "e2eformbrief0000000000000";
const SVC_ID = "e2esvcbrief00000000000000";
const CS_ID = "e2ecsbrief000000000000000";
const RESET_EMAIL = "e2e-reset-fixture@example.test";
const hashToken = (raw) => createHash("sha256").update(raw).digest("hex");

async function seedBriefing() {
  const portal = await prisma.user.findFirst({ where: { email: PORTAL_EMAIL }, select: { clienteId: true } });
  if (!portal?.clienteId) throw new Error(`Cliente do Portal (${PORTAL_EMAIL}) não encontrado — rode o seed base primeiro.`);
  const clienteId = portal.clienteId;

  // Idempotente: limpa o fixture anterior (inclusive respostas) e recria.
  await prisma.formularioResposta.deleteMany({ where: { requisitoId: REQ_ID } });
  await prisma.formularioCampo.deleteMany({ where: { formularioId: FORM_ID } });
  await prisma.servicoRequisito.deleteMany({ where: { id: REQ_ID } });
  await prisma.formulario.deleteMany({ where: { id: FORM_ID } });
  await prisma.clienteServico.deleteMany({ where: { id: CS_ID } });
  await prisma.servico.deleteMany({ where: { id: SVC_ID } });

  await prisma.servico.create({ data: { id: SVC_ID, nome: "Servico E2E Briefing" } });
  await prisma.clienteServico.create({ data: { id: CS_ID, clienteId, servicoId: SVC_ID } });
  await prisma.formulario.create({ data: { id: FORM_ID, titulo: "Briefing E2E" } });
  const campos = [
    { rotulo: "Curto", tipo: "TEXTO_CURTO", opcoes: null },
    { rotulo: "Longo", tipo: "TEXTO_LONGO", opcoes: null },
    { rotulo: "Escolha", tipo: "ESCOLHA", opcoes: JSON.stringify(["A", "B"]) },
    { rotulo: "Multipla", tipo: "MULTIPLA", opcoes: JSON.stringify(["X", "Y", "Z"]) },
    { rotulo: "Numero", tipo: "NUMERO", opcoes: null },
    { rotulo: "SimNao", tipo: "SIM_NAO", opcoes: null },
    { rotulo: "Data", tipo: "DATA", opcoes: null },
  ];
  await prisma.formularioCampo.createMany({
    data: campos.map((c, i) => ({ id: `e2ec${i}`, formularioId: FORM_ID, rotulo: c.rotulo, tipo: c.tipo, ordem: i, opcoes: c.opcoes })),
  });
  await prisma.servicoRequisito.create({
    data: { id: REQ_ID, servicoId: SVC_ID, titulo: "Briefing E2E", tipo: "BRIEFING", formularioId: FORM_ID },
  });
  return REQ_ID;
}

// Dados dinâmicos p/ os testes (ids/nomes variam a cada seed — NUNCA hardcodar).
async function seedIsolamento() {
  const portal = await prisma.user.findFirst({
    where: { email: PORTAL_EMAIL },
    select: { clienteId: true, cliente: { select: { nome: true } } },
  });
  if (!portal?.clienteId) throw new Error("Cliente do Portal não encontrado.");
  const portalClienteId = portal.clienteId;
  const portalClienteNome = portal.cliente?.nome ?? "";
  const outro = await prisma.cliente.findFirst({ where: { id: { not: portalClienteId }, deletedAt: null }, select: { id: true } });
  if (!outro) throw new Error("Nenhum OUTRO cliente para testes de isolamento.");
  const outroClienteId = outro.id;
  const ator = await prisma.user.findFirst({ where: { role: { in: ["ROOT", "ADMIN"] }, ativo: true }, select: { id: true } });

  // Documento e chamado do OUTRO cliente (isolamento) — idempotentes.
  const DOC_ID = "e2edocalheio000000000000";
  const CONV_ID = "e2econvalheio00000000000";
  await prisma.documento.deleteMany({ where: { id: DOC_ID } });
  await prisma.documento.create({ data: { id: DOC_ID, clienteId: outroClienteId, titulo: "Documento E2E (alheio)", conteudo: "conteudo", status: "ENVIADO", criadoPorId: ator?.id ?? null } });
  await prisma.conversa.deleteMany({ where: { id: CONV_ID } });
  await prisma.conversa.create({ data: { id: CONV_ID, tipo: "CLIENTE", clienteId: outroClienteId, assunto: "Chamado E2E (alheio)", status: "ABERTO" } });

  // Briefing ENVIADO no OUTRO cliente, p/ a visão da EQUIPE (Bloco 7 — "Ver respostas" na ficha).
  // Fica no outro cliente (não no do Portal) para o teste da equipe não colidir com o cancelamento
  // de serviços feito pelo teste do Portal. Reusa o serviço/briefing/campos semeados em seedBriefing.
  await prisma.formularioResposta.deleteMany({ where: { clienteId: outroClienteId, requisitoId: REQ_ID } });
  await prisma.clienteServico.upsert({
    where: { clienteId_servicoId: { clienteId: outroClienteId, servicoId: SVC_ID } },
    update: { status: "ATIVO" },
    create: { clienteId: outroClienteId, servicoId: SVC_ID, status: "ATIVO" },
  });
  await prisma.formularioResposta.create({
    data: {
      formularioId: FORM_ID,
      clienteId: outroClienteId,
      requisitoId: REQ_ID,
      servicoId: SVC_ID,
      status: "ENVIADO",
      enviadoEm: new Date(),
      respostas: JSON.stringify({ e2ec0: "Resposta curta FUNC", e2ec1: "Linha A\nLinha B", e2ec2: "A", e2ec3: ["X", "Z"], e2ec4: "42", e2ec5: "Sim", e2ec6: "2026-07-20" }),
    },
  });

  return { portalClienteId, portalClienteNome, outroClienteId, outroDocId: DOC_ID, outroConversaId: CONV_ID };
}

/**
 * Projeto determinístico.
 *
 * `flows-projetos` e `responsividade` abriam "o primeiro projeto do seed" — mas nem o `db:seed`
 * nem o `db:demo` criam projetos: eles apareciam por efeito colateral de `flows-comercial`, que
 * roda antes por ordem alfabética e converte um lead. Dependência de ordem disfarçada de seed:
 * num banco recém-criado a cadeia começa vazia e 5 testes quebravam. Aqui o projeto passa a
 * existir sempre, independente de quais specs rodem ou em que ordem.
 */
async function seedProjeto() {
  const PRJ_ID = "e2eprojetofixture0000000";
  const cliente = await prisma.cliente.findFirst({ where: { deletedAt: null }, select: { id: true } });
  if (!cliente) throw new Error("Nenhum cliente para ancorar o projeto de fixture.");
  const dono = await prisma.user.findFirst({ where: { role: { in: ["ROOT", "ADMIN"] }, ativo: true }, select: { id: true } });

  await prisma.card.deleteMany({ where: { projetoId: PRJ_ID } });
  await prisma.projeto.deleteMany({ where: { id: PRJ_ID } });
  await prisma.projeto.create({
    data: {
      id: PRJ_ID,
      nome: "Projeto E2E (fixture)",
      clienteId: cliente.id,
      status: "ATIVO",
      responsavelId: dono?.id ?? null,
    },
  });
  return PRJ_ID;
}

async function seedReset() {
  const user = await prisma.user.upsert({
    where: { email: RESET_EMAIL },
    update: { ativo: true, deletedAt: null },
    create: { email: RESET_EMAIL, nome: "Reset E2E", passwordHash: "dummy", role: "FUNCIONARIO", ativo: true },
  });
  await prisma.token.deleteMany({ where: { userId: user.id } });
  const rawValid = randomBytes(24).toString("hex");
  const rawExpired = randomBytes(24).toString("hex");
  await prisma.token.create({ data: { tokenHash: hashToken(rawValid), tipo: "RESET", userId: user.id, expiresAt: new Date(Date.now() + 3600_000) } });
  await prisma.token.create({ data: { tokenHash: hashToken(rawExpired), tipo: "RESET", userId: user.id, expiresAt: new Date(Date.now() - 3600_000) } });
  return { rawValid, rawExpired };
}

async function main() {
  const briefingReqId = await seedBriefing();
  const iso = await seedIsolamento();
  const projetoId = await seedProjeto();
  const reset = await seedReset();
  mkdirSync("e2e/.auth", { recursive: true });
  writeFileSync(
    "e2e/.auth/fixtures.json",
    JSON.stringify(
      { briefingReqId, ...iso, projetoId, resetRawValid: reset.rawValid, resetRawExpired: reset.rawExpired },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  console.log("✓ fixtures E2E semeadas (briefing + isolamento + projeto + reset) → e2e/.auth/fixtures.json");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
