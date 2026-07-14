import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte E2E reproduzível. Roda contra o app em execução (dev: web 4310 / api 4319, ou E2E_BASE_URL).
 * Auth por papel via storageState (e2e/.auth/*.json — NÃO versionado). Ver #2/#5 da finalização.
 * Credenciais por env (E2E_PASSWORD); e-mails dos papéis-semente são públicos (não são segredo).
 */
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:4310";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
  ],
});
