import OpenAI, { toFile } from "openai";
import { config, isAiEnabled } from "../config.js";

/**
 * Camada de IA (Fase 9) — provedor OpenAI. Ver docs/DECISIONS.md ADR-6.
 *
 * `gerarRascunho` sempre produz TEXTO de rascunho — o envio de documento exige
 * aprovação humana (garantido pelo fluxo de status). Versões geradas por IA são
 * marcadas com `origem: "IA"`. Se não houver OPENAI_API_KEY, lança erro claro.
 */
export interface AiService {
  gerarRascunho(system: string, user: string): Promise<string>;
  /** Transcreve um áudio (reunião, ditado) para texto — usado em Ata/Pauta/IA. */
  transcrever(buffer: Buffer, filename: string): Promise<string>;
}

const MODELO = "gpt-4o-mini"; // barato e capaz (decisão de custo — ADR-6)

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!isAiEnabled) {
    throw new Error("IA não configurada. Defina OPENAI_API_KEY no .env.");
  }
  if (!client) client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return client;
}

export const aiService: AiService = {
  async gerarRascunho(system: string, user: string): Promise<string> {
    const resp = await getClient().chat.completions.create({
      model: MODELO,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() ?? "";
  },

  async transcrever(buffer: Buffer, filename: string): Promise<string> {
    const file = await toFile(buffer, filename);
    const resp = await getClient().audio.transcriptions.create({ file, model: "whisper-1", language: "pt" });
    return (resp.text ?? "").trim();
  },
};
