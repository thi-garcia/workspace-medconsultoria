import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

// E-mails dos papéis-semente (públicos). Senha por env (default = senha demo local, NÃO é segredo de prod).
const PASS = process.env.E2E_PASSWORD ?? "medconsultoria123";
export const USERS = {
  root: "root@medconsultoria.com.br",
  admin: "thais.garcia@medconsultoria.com.br",
  funcionario: "func@medconsultoria.com.br",
  cliente: "cliente@medconsultoria.com.br",
} as const;

mkdirSync("e2e/.auth", { recursive: true });

for (const [role, email] of Object.entries(USERS)) {
  setup(`login ${role}`, async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole("button", { name: /entrar/i }).click();
    // Sinal de sucesso agnóstico ao papel: some o formulário (equipe → shell; CLIENTE → Portal,
    // que fica na mesma URL /login). Se as credenciais falharem, o campo de senha continua.
    await expect(page.locator('input[type="password"]'), `login ${role} deve concluir`).toHaveCount(0, { timeout: 20000 });
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
