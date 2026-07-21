/**
 * DIAGNÓSTICO DE ACESSO — responde "por que não consigo entrar?" em segundos.
 *
 *   pnpm acessos
 *
 * Para cada conta cadastrada, faz um login DE VERDADE contra a API que está no ar (o mesmo
 * caminho que o navegador usa) e diz exatamente o que acontece. Evita o chute de "deve ser
 * a senha": ou a conta autentica, ou o motivo aparece na tela.
 *
 * Não altera nada. Não envia e-mail. A senha de teste vem do `.env` (SEED_ROOT_PASSWORD).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env", "utf8").split("\n")) {
  const m = linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API = `http://localhost:${process.env.API_PORT ?? 4319}`;
const WEB = process.env.WEB_ORIGIN ?? "http://localhost:4310";
const SENHA = process.env.SEED_ROOT_PASSWORD;
const BANCO = new URL(process.env.DATABASE_URL!).pathname.replace("/", "");

function sql(query: string): string {
  const r = spawnSync(
    "docker",
    ["exec", "medconsultoria-mysql", "mysql", "-uroot", "-proot", "--default-character-set=utf8mb4", "-N", "-e", `USE \`${BANCO}\`; ${query}`],
    { encoding: "utf8" },
  );
  return (r.stdout || "").trim();
}

async function main() {
  console.log(`\n▸ app: ${WEB}   ▸ api: ${API}   ▸ banco: ${BANCO}\n`);

  const saude = await fetch(`${API}/health`).then((r) => r.ok).catch(() => false);
  if (!saude) {
    console.error("✗ A API não respondeu. A aplicação está no ar? (`pnpm dev`)\n");
    process.exit(1);
  }

  const linhas = sql("SELECT email, role, ativo, IF(passwordHash IS NULL,'sem-senha','ok') FROM `User` ORDER BY role DESC")
    .split("\n")
    .filter(Boolean);

  if (!linhas.length) {
    console.error("✗ Nenhum usuário no banco. Rode `pnpm db:seed`.\n");
    process.exit(1);
  }

  console.log("CONTA                                     PAPEL         LOGIN");
  console.log("─".repeat(78));

  let falhas = 0;
  for (const linha of linhas) {
    const [email, role, ativo, temSenha] = linha.split("\t");
    let veredito: string;

    if (ativo !== "1") veredito = "✗ conta INATIVA";
    else if (temSenha !== "ok") veredito = "✗ convite ainda não aceito (sem senha)";
    else if (!SENHA) veredito = "? SEED_ROOT_PASSWORD ausente no .env — não dá para testar";
    else {
      const res = await fetch(`${API}/trpc/auth.login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: WEB },
        body: JSON.stringify({ json: { email, password: SENHA } }),
      });
      if (res.ok) veredito = "✓ entra com a senha de teste";
      else {
        const corpo = await res.text();
        veredito = /TOO_MANY_REQUESTS/.test(corpo)
          ? "✗ BLOQUEADA por excesso de tentativas (espere 15 min)"
          : "✗ senha diferente da de teste (já foi trocada?)";
      }
    }

    if (veredito.startsWith("✗")) falhas++;
    console.log(`${email.padEnd(41)} ${role.padEnd(13)} ${veredito}`);
  }

  console.log("─".repeat(78));

  // Tentativas que FALHARAM de verdade (o que o navegador enviou). É isto que transforma
  // "não consigo entrar" em diagnóstico: mostra o e-mail que chegou e o motivo exato.
  const recentes = sql(
    `SELECT DATE_FORMAT(createdAt, '%d/%m %H:%i'),
            JSON_UNQUOTE(JSON_EXTRACT(dados, '$.email')),
            JSON_UNQUOTE(JSON_EXTRACT(dados, '$.motivo'))
     FROM \`ActivityLog\` WHERE acao = 'login.falhou'
     ORDER BY createdAt DESC LIMIT 10`,
  );
  if (recentes) {
    console.log("\nÚLTIMAS TENTATIVAS QUE FALHARAM (o que o navegador enviou):");
    for (const linha of recentes.split("\n").filter(Boolean)) {
      const [quando, email, motivo] = linha.split("\t");
      console.log(`  ${quando}  ${String(email).padEnd(40)} ${motivo}`);
    }
  } else {
    console.log("\nNenhuma tentativa de login falhou desde a última atualização do servidor.");
  }

  if (falhas) {
    console.log(`\n${falhas} conta(s) com problema.\n`);
  } else {
    console.log("\n✓ Todas as contas autenticam pela API.");
    console.log("\nSe mesmo assim o navegador recusa, é o AUTOFILL repondo uma conta antiga:");
    console.log("  1. abra a página de login e APAGUE o e-mail preenchido (não confie no que aparece);");
    console.log("  2. digite o e-mail da tabela acima;");
    console.log("  3. se o Chrome repuser sozinho, abra uma janela anônima (Ctrl+Shift+N).\n");
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}\n`);
  process.exit(1);
});
