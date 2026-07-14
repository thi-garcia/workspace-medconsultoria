import { defineConfig } from "vitest/config";

// jsdom: DOMPurify e testes de sanitização precisam de DOM. Só testes puros/utilitários.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    testTimeout: 15000,
  },
});
