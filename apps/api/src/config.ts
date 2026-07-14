import { z } from "zod";

/**
 * Configuração validada no boot. O app NÃO sobe com env inválida.
 * Carrega o .env da raiz do monorepo (feito pelo tsx/node via --env-file ou dotenv no server).
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4319),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET deve ter ao menos 16 caracteres"),
  WEB_ORIGIN: z.string().url().default("http://localhost:4310"),
  OPENAI_API_KEY: z.string().optional(),
  // Pasta persistente onde ficam os arquivos enviados (upload). Relativa ao cwd do
  // processo ou absoluta. Na TineHost deve apontar para uma pasta FORA do diretório do
  // deploy (que é sobrescrito no rsync) e entrar no backup. Ver DECISIONS (pendência de deploy).
  UPLOADS_DIR: z.string().default("storage/uploads"),
  // E-mail transacional (opcional). Sem SMTP_HOST, o app roda em "modo dev":
  // os convites/links são exibidos na tela em vez de enviados por e-mail.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Configuração inválida:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export const isProd = config.NODE_ENV === "production";
/** IA (OpenAI) só fica disponível se houver chave configurada. */
export const isAiEnabled = !!config.OPENAI_API_KEY;
/** E-mail "real" só quando SMTP está completo; caso contrário, modo dev (link em tela). */
export const isEmailReal = !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
