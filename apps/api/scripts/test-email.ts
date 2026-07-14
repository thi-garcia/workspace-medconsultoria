import "dotenv/config";
import nodemailer from "nodemailer";
import { config, isEmailReal } from "../src/config.js";
import { montarEmail } from "../src/lib/email-template.js";
import { LOGO_CID } from "../src/lib/email-template.js";
import { LOGO_PNG_BASE64 } from "../src/lib/brand-assets.js";

const destino = process.argv[2] ?? "contato@medconsultoria.com.br";

async function main() {
  console.log("isEmailReal:", isEmailReal);
  console.log("SMTP:", config.SMTP_HOST, config.SMTP_PORT, "user:", config.SMTP_USER, "from:", config.SMTP_FROM);
  if (!isEmailReal) {
    console.error("SMTP incompleto — preencha SMTP_HOST/USER/PASS.");
    process.exit(1);
  }

  const port = config.SMTP_PORT ?? 587;
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });

  console.log("\nVerificando conexão/autenticação…");
  await transporter.verify();
  console.log("✔ Conexão SMTP OK");

  const { html, texto } = montarEmail({
    preheader: "Teste de configuração de e-mail do Workspace MedConsultoria.",
    titulo: "Teste de e-mail — está funcionando! ✅",
    saudacao: "Olá!",
    paragrafos: [
      "Este é um e-mail de <strong>teste</strong> para validar a configuração de envio (SMTP) e o design das mensagens.",
      "Se você está vendo o logotipo no topo, o botão verde abaixo, a assinatura e o rodapé com links, está tudo certo.",
    ],
    cta: { texto: "Acessar o workspace", url: "https://workspace.medconsultoria.com.br" },
    nota: "Pode ignorar — é apenas um teste de configuração.",
  });

  console.log(`\nEnviando para ${destino}…`);
  const info = await transporter.sendMail({
    from: config.SMTP_FROM ?? config.SMTP_USER,
    to: destino,
    subject: "✅ Teste de e-mail — MedConsultoria",
    text: texto,
    html,
    attachments: [
      { filename: "logo.png", content: Buffer.from(LOGO_PNG_BASE64, "base64"), cid: LOGO_CID, contentType: "image/png" },
    ],
  });
  console.log("✔ Enviado. messageId:", info.messageId, "| accepted:", info.accepted, "| rejected:", info.rejected);
}

main().catch((e) => {
  console.error("\n✖ FALHA:", e?.message ?? e);
  if (e?.code) console.error("  code:", e.code, "| command:", e.command, "| response:", e.response);
  process.exit(1);
});
