/**
 * Abstração central de hash e verificação de senhas.
 *
 * - **Primário: Argon2id** (`@node-rs/argon2`, binário nativo). É o algoritmo padrão para
 *   NOVOS hashes e o preferido para verificação.
 * - **Plano B portátil: bcryptjs** (JS puro, sem binário nativo) — só é USADO para *gerar*
 *   hash quando o Argon2 realmente não carrega no ambiente (ex.: hospedagem compartilhada sem
 *   suporte ao binário nativo). Nunca substitui gratuitamente o Argon2, nunca quebra hashes
 *   Argon2 existentes.
 *
 * O algoritmo de um hash é identificado pelo **prefixo**: `$argon2...` (Argon2) ou `$2a/$2b/$2y`
 * (bcrypt). A verificação faz o dispatch pelo prefixo, então ambos coexistem no banco durante a
 * transição. No login bem-sucedido, um hash que não seja Argon2id é **reescrito (rehash)** para
 * Argon2id — ver `precisaRehash()` e o uso em `auth.service.login`.
 *
 * IMPORTANTE: se o Argon2 não carregar mas houver hashes Argon2 no banco, esses hashes NÃO podem
 * ser verificados. O **preflight de produção** (`scripts/preflight.mjs`) testa o Argon2 ANTES do
 * deploy justamente para impedir esse cenário. Ver decisão #3 da finalização e docs/DEPLOY.md.
 */

type ArgonModule = typeof import("@node-rs/argon2");
type BcryptModule = typeof import("bcryptjs");

const ARGON2_PREFIX = "$argon2";
// bcrypt: $2$, $2a$, $2b$, $2y$
const BCRYPT_PREFIX_RE = /^\$2[aby]?\$/;

// Carregamento LAZY dos módulos: `undefined` = ainda não tentado, `null` = falhou ao carregar.
let argonMod: ArgonModule | null | undefined;
let bcryptMod: BcryptModule | null | undefined;

async function getArgon(): Promise<ArgonModule | null> {
  if (argonMod === undefined) {
    try {
      argonMod = await import("@node-rs/argon2");
    } catch {
      argonMod = null;
    }
  }
  return argonMod;
}

async function getBcrypt(): Promise<BcryptModule | null> {
  if (bcryptMod === undefined) {
    try {
      const m = await import("bcryptjs");
      // bcryptjs exporta como default em ESM e como namespace em CJS — normaliza.
      bcryptMod = ((m as { default?: BcryptModule }).default ?? m) as BcryptModule;
    } catch {
      bcryptMod = null;
    }
  }
  return bcryptMod;
}

export type AlgoritmoSenha = "argon2id" | "bcrypt" | "desconhecido";

/** Identifica o algoritmo de um hash pelo seu prefixo (sem tentar verificar). */
export function algoritmoDoHash(hash: string): AlgoritmoSenha {
  if (hash.startsWith(ARGON2_PREFIX)) return "argon2id";
  if (BCRYPT_PREFIX_RE.test(hash)) return "bcrypt";
  return "desconhecido";
}

/**
 * Gera o hash de uma senha. Usa Argon2id (primário). Só cai para bcrypt (Plano B) se o Argon2
 * REALMENTE não carregar no ambiente — nunca por escolha gratuita.
 */
export async function hashPassword(senha: string): Promise<string> {
  const argon = await getArgon();
  if (argon) return argon.hash(senha);
  const bcrypt = await getBcrypt();
  if (bcrypt) return bcrypt.hash(senha, 12);
  throw new Error("Nenhum algoritmo de hash disponível: '@node-rs/argon2' e 'bcryptjs' falharam ao carregar.");
}

/**
 * Verifica uma senha contra o hash armazenado, escolhendo o algoritmo pelo prefixo do hash.
 * Argon2 e bcrypt coexistem. Hash de formato desconhecido → nega (false), nunca lança por isso.
 */
export async function verifyPassword(hashArmazenado: string, senha: string): Promise<boolean> {
  const algo = algoritmoDoHash(hashArmazenado);
  if (algo === "argon2id") {
    const argon = await getArgon();
    if (!argon) {
      // Hash Argon2 no banco mas Argon2 indisponível: cenário que o preflight deve impedir.
      throw new Error("Hash Argon2 encontrado, mas '@node-rs/argon2' não pôde ser carregado neste ambiente.");
    }
    try {
      return await argon.verify(hashArmazenado, senha);
    } catch {
      return false;
    }
  }
  if (algo === "bcrypt") {
    const bcrypt = await getBcrypt();
    if (!bcrypt) {
      throw new Error("Hash bcrypt encontrado, mas 'bcryptjs' (Plano B) não está instalado.");
    }
    try {
      return await bcrypt.compare(senha, hashArmazenado);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Diz se um hash deve ser reescrito para o algoritmo primário (Argon2id) no próximo login
 * bem-sucedido. Verdadeiro quando o hash NÃO é Argon2id **e** o Argon2 está disponível para
 * gerar o novo hash. Assim, hashes legados (bcrypt) migram para Argon2id de forma transparente,
 * sem forçar reset de senha e sem quebrar nada.
 */
export async function precisaRehash(hashArmazenado: string): Promise<boolean> {
  if (algoritmoDoHash(hashArmazenado) === "argon2id") return false;
  return (await getArgon()) !== null;
}

/** Resultado de um teste do diagnóstico de compatibilidade. */
export interface CheckDiagnostico {
  nome: string;
  ok: boolean;
  detalhe?: string;
}

/** Resultado completo do diagnóstico de compatibilidade do hash de senha. */
export interface DiagnosticoSenha {
  ok: boolean;
  algoritmoPrimario: AlgoritmoSenha; // qual seria usado para NOVOS hashes neste ambiente
  planoBDisponivel: boolean; // bcryptjs carrega?
  node: string;
  plataforma: string; // ex.: "win32/x64"
  duracaoMs: number;
  checks: CheckDiagnostico[];
}

/**
 * Diagnóstico de compatibilidade do hash de senha — usado pelo preflight de produção e por testes.
 * Testa, com falha controlada e mensagens claras:
 *  1) carregamento do módulo Argon2;
 *  2) geração de hash;
 *  3) verificação correta (senha certa → true);
 *  4) rejeição de senha incorreta (senha errada → false);
 *  5) tempo de execução;
 *  6) versão/plataforma do Node;
 *  7) disponibilidade do Plano B (bcryptjs) e verificação de um hash bcrypt.
 * NÃO lança: qualquer falha vira um check `ok:false` com detalhe legível.
 */
export async function diagnosticoSenha(): Promise<DiagnosticoSenha> {
  const t0 = Date.now();
  const checks: CheckDiagnostico[] = [];
  const push = (nome: string, ok: boolean, detalhe?: string) => checks.push({ nome, ok, detalhe });

  const node = process.version;
  const plataforma = `${process.platform}/${process.arch}`;
  push("node/plataforma", true, `Node ${node} · ${plataforma}`);

  // 1) Carregamento do Argon2
  const argon = await getArgon();
  push("argon2.carrega", !!argon, argon ? "@node-rs/argon2 carregado" : "@node-rs/argon2 NÃO carregou (binário nativo indisponível?)");

  let algoritmoPrimario: AlgoritmoSenha = "desconhecido";
  if (argon) {
    algoritmoPrimario = "argon2id";
    const SENHA = "diagnostico-senha-correta-#2026";
    const ERRADA = "diagnostico-senha-ERRADA-#2026";
    try {
      const h = await argon.hash(SENHA);
      push("argon2.gera_hash", algoritmoDoHash(h) === "argon2id", `prefixo: ${h.slice(0, 12)}…`);
      // 3) verificação correta
      const certo = await argon.verify(h, SENHA);
      push("argon2.verifica_correta", certo === true, certo ? "senha correta aceita" : "FALHOU: senha correta rejeitada");
      // 4) rejeição de senha incorreta
      const errado = await argon.verify(h, ERRADA);
      push("argon2.rejeita_incorreta", errado === false, errado ? "FALHOU: senha errada aceita" : "senha errada rejeitada");
    } catch (e) {
      push("argon2.gera_verifica", false, `exceção: ${(e as Error).message}`);
    }
  }

  // 7) Plano B (bcryptjs)
  const bcrypt = await getBcrypt();
  const planoBDisponivel = !!bcrypt;
  push("bcrypt.carrega", planoBDisponivel, planoBDisponivel ? "bcryptjs disponível (Plano B)" : "bcryptjs NÃO instalado");
  if (bcrypt) {
    try {
      const h = await bcrypt.hash("plano-b-teste", 8);
      const okB = (await bcrypt.compare("plano-b-teste", h)) && !(await bcrypt.compare("errada", h));
      push("bcrypt.gera_verifica", okB, okB ? "hash/verify bcrypt ok" : "FALHOU bcrypt");
    } catch (e) {
      push("bcrypt.gera_verifica", false, `exceção: ${(e as Error).message}`);
    }
  }
  if (!argon) algoritmoPrimario = planoBDisponivel ? "bcrypt" : "desconhecido";

  const duracaoMs = Date.now() - t0;
  push("tempo", duracaoMs < 5000, `${duracaoMs}ms`);

  // O ambiente é considerado compatível se o algoritmo primário existe e passou nos testes.
  const argonOk = checks.filter((c) => c.nome.startsWith("argon2")).every((c) => c.ok);
  const ok = argon ? argonOk : planoBDisponivel;

  return { ok, algoritmoPrimario, planoBDisponivel, node, plataforma, duracaoMs, checks };
}
