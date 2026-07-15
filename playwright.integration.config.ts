import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte de INTEGRAÇÃO EXTERNA (separada da funcional principal): depende do Mailpit
 * (transporte SMTP de teste) em :8025 e do app em modo SMTP→Mailpit. NÃO entra no
 * gate de "0 skipped" da suíte principal. Rodar com:
 *   pnpm exec playwright test --config playwright.integration.config.ts
 * Pré-requisitos: Mailpit no ar + e2e/.auth/*.json (gerados pela setup da suíte principal).
 */
export default defineConfig({
  testDir: "./e2e-integration",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4310",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
