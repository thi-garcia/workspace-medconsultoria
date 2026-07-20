/**
 * Trava de segurança dos seeds de EXEMPLO (`demo-seed.ts`).
 *
 * O `demo-seed` insere clientes fictícios e usuários com senha padrão. Rodá-lo contra o banco
 * de produção seria um incidente. Esta função decide, a partir do ambiente, se pode rodar.
 *
 * Função pura (sem I/O) para ser testável.
 */
export interface AmbienteSeed {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  /** Escotilha de emergência consciente: `DEMO_SEED_CONFIRMO=1` libera mesmo em banco remoto. */
  DEMO_SEED_CONFIRMO?: string;
}

export interface ResultadoGuard {
  permitido: boolean;
  motivo: string;
}

/** Hosts considerados seguros: desenvolvimento local e os containers da CI. */
const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "::1", "mysql", "host.docker.internal"]);

function hostDaUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function podeRodarDemoSeed(env: AmbienteSeed): ResultadoGuard {
  if (env.NODE_ENV === "production") {
    return { permitido: false, motivo: "NODE_ENV=production — dados de exemplo nunca vão para produção." };
  }

  const url = env.DATABASE_URL;
  if (!url) {
    return { permitido: false, motivo: "DATABASE_URL ausente — impossível confirmar que o banco é local." };
  }

  const host = hostDaUrl(url);
  if (!host) {
    return { permitido: false, motivo: "DATABASE_URL inválida — impossível confirmar que o banco é local." };
  }

  if (HOSTS_LOCAIS.has(host)) {
    return { permitido: true, motivo: `banco local (${host})` };
  }

  if (env.DEMO_SEED_CONFIRMO === "1") {
    return { permitido: true, motivo: `host remoto (${host}) liberado por DEMO_SEED_CONFIRMO=1` };
  }

  return {
    permitido: false,
    motivo:
      `banco remoto (${host}) — o demo-seed insere dados fictícios e usuários com senha padrão. ` +
      "Se for MESMO isso que você quer, rode com DEMO_SEED_CONFIRMO=1.",
  };
}
