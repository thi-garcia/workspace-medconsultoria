import { TRPCError } from "@trpc/server";
import { prisma } from "@app/db";
import { notificar } from "../notificacoes/notificacoes.service.js";
import { removerArquivo as removerArquivoDisco } from "../../lib/storage.js";
import { reconciliarCardsDoServico } from "../projetos/projetos.service.js";

/** Destinatários internos de um aviso sobre um cliente: responsável + gestão (ADMIN/ROOT). */
export async function equipeDoCliente(clienteId: string, excluir?: string): Promise<string[]> {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { responsavelId: true } });
  const gestao = await prisma.user.findMany({
    where: { ativo: true, deletedAt: null, role: { in: ["ADMIN", "ROOT"] } },
    select: { id: true },
  });
  const ids = new Set<string>(gestao.map((g) => g.id));
  if (cliente?.responsavelId) ids.add(cliente.responsavelId);
  if (excluir) ids.delete(excluir);
  return [...ids];
}

interface RegistrarUploadInput {
  clienteId: string;
  servicoId?: string | null;
  requisitoId?: string | null;
  nome: string;
  mimetype: string;
  tamanho: number;
  caminho: string;
  enviadoPorTipo: "CLIENTE" | "EQUIPE";
  enviadoPorId: string;
}

/**
 * Registra os metadados de um arquivo já gravado no disco. Se veio do CLIENTE (Portal),
 * avisa a equipe (notificação + e-mail `documento_cliente_enviado`).
 */
export async function registrarUpload(input: RegistrarUploadInput) {
  const arquivo = await prisma.arquivo.create({
    data: {
      clienteId: input.clienteId,
      servicoId: input.servicoId ?? null,
      requisitoId: input.requisitoId ?? null,
      nome: input.nome,
      mimetype: input.mimetype,
      tamanho: input.tamanho,
      caminho: input.caminho,
      enviadoPorTipo: input.enviadoPorTipo,
      enviadoPorId: input.enviadoPorId,
    },
  });

  if (input.enviadoPorTipo === "CLIENTE") {
    const cliente = await prisma.cliente.findUnique({ where: { id: input.clienteId }, select: { nome: true } });
    const destinos = await equipeDoCliente(input.clienteId);
    for (const uid of destinos) {
      await notificar(
        uid,
        "documento_cliente_enviado",
        { cliente: cliente?.nome ?? "Cliente", documento: input.nome },
        { entidadeTipo: "cliente", entidadeId: input.clienteId },
      ).catch(() => {});
    }
  }

  // Automação: entregar um documento de uma exigência marca o item no card do serviço e move o card.
  if (input.requisitoId) {
    const servicoId = input.servicoId ?? (await prisma.servicoRequisito.findUnique({ where: { id: input.requisitoId }, select: { servicoId: true } }))?.servicoId ?? null;
    if (servicoId) await reconciliarCardsDoServico(input.clienteId, servicoId).catch(() => {});
  }
  return arquivo;
}

/** Lista os arquivos (não removidos) de um cliente, opcionalmente de um serviço. */
export async function listarArquivos(clienteId: string, servicoId?: string) {
  const rows = await prisma.arquivo.findMany({
    where: { clienteId, deletedAt: null, ...(servicoId ? { servicoId } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      mimetype: true,
      tamanho: true,
      servicoId: true,
      requisitoId: true,
      enviadoPorTipo: true,
      createdAt: true,
      servico: { select: { nome: true } },
      requisito: { select: { titulo: true } },
    },
  });
  return rows;
}

/** Busca um arquivo para download (metadados + caminho). Lança se não existe/removido. */
export async function getArquivo(id: string) {
  const arquivo = await prisma.arquivo.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, nome: true, mimetype: true, caminho: true, clienteId: true },
  });
  if (!arquivo) throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado." });
  return arquivo;
}

/**
 * Remove um arquivo (soft-delete do registro + apaga do disco). Se `clienteScope` vier,
 * garante que o arquivo é daquele cliente (escopo do Portal).
 */
export async function removerArquivo(id: string, clienteScope?: string) {
  const arquivo = await prisma.arquivo.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, caminho: true, clienteId: true, servicoId: true, requisitoId: true },
  });
  if (!arquivo) throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado." });
  if (clienteScope && arquivo.clienteId !== clienteScope) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este arquivo." });
  }
  await prisma.arquivo.update({ where: { id }, data: { deletedAt: new Date() } });
  await removerArquivoDisco(arquivo.caminho);

  // Remover a entrega pode desmarcar o item e voltar o card para "Aguardando cliente".
  if (arquivo.requisitoId) {
    const servicoId = arquivo.servicoId ?? (await prisma.servicoRequisito.findUnique({ where: { id: arquivo.requisitoId }, select: { servicoId: true } }))?.servicoId ?? null;
    if (servicoId) await reconciliarCardsDoServico(arquivo.clienteId, servicoId).catch(() => {});
  }
  return { ok: true };
}
