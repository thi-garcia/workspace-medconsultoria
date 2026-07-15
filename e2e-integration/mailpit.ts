// Helper de leitura do Mailpit (transporte SMTP de teste — sink local, nada sai para a internet).
// A suíte de integração depende do Mailpit em http://localhost:8025 e do app em modo SMTP→Mailpit.
const MAILPIT = "http://localhost:8025";

export async function limparCaixa() {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
}

interface MailSummary {
  ID: string;
  To: { Address: string }[];
  Subject: string;
}

/** Espera e retorna o e-mail mais recente para `endereco` (assunto opcional). */
export async function esperarEmail(endereco: string, opts: { assuntoInclui?: string; timeoutMs?: number } = {}): Promise<{ id: string; subject: string; text: string; html: string }> {
  const timeout = opts.timeoutMs ?? 15_000;
  const ini = Date.now();
  while (Date.now() - ini < timeout) {
    const r = await fetch(`${MAILPIT}/api/v1/messages`);
    const data = (await r.json()) as { messages: MailSummary[] };
    const match = data.messages.find(
      (m) => m.To.some((t) => t.Address.toLowerCase() === endereco.toLowerCase()) && (!opts.assuntoInclui || m.Subject.includes(opts.assuntoInclui)),
    );
    if (match) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${match.ID}`)).json();
      return { id: match.ID, subject: match.Subject, text: full.Text ?? "", html: full.HTML ?? "" };
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error(`Nenhum e-mail para ${endereco} em ${timeout}ms`);
}

/** Extrai um caminho+query (ex.: /definir-senha?token=…) do corpo do e-mail. */
export function extrairLink(corpo: string, rota: string): string {
  const re = new RegExp(`https?://[^\\s"'<>]*${rota}\\?token=[A-Za-z0-9_-]+`, "i");
  const m = corpo.match(re);
  if (!m) throw new Error(`Link ${rota} não encontrado no e-mail`);
  // Converte para caminho relativo (o baseURL do teste cuida do host).
  return m[0].replace(/^https?:\/\/[^/]+/, "");
}
