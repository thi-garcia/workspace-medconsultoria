// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * ESLint 9 (flat config) para o monorepo. Foco em BUGS REAIS (não formatação — isso é do
 * Prettier). Régua pragmática por instrução explícita do dono ("configure ESLint/Prettier" +
 * "evite reformas cosméticas desnecessárias"): pega erro, não reforma estilo.
 */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/*.d.ts",
      "packages/db/prisma/migrations/**",
      ".playwright-mcp/**",
      "apps/api/dist/**",
      "apps/web/dist/**",
      "**/coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": ["warn", { "ts-expect-error": "allow-with-description", "ts-ignore": "allow-with-description" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts", "scripts/**/*.{js,mjs}", "*.{js,mjs,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/e2e/**"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  prettier,
);
