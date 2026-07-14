import { test, expect, type Page } from "@playwright/test";

// Cenário 6 — Agenda: criar/editar/persistir evento + regra de conflito de horário.
// Fuso America/Sao_Paulo: datetime-local é hora de parede local (o app converte).
test.use({ storageState: "e2e/.auth/admin.json" });

const RUN = `AG${Date.now().toString().slice(-6)}`;
const EVT = `Evento ${RUN}`;

async function abrirNovoEvento(page: Page) {
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Novo evento" }).click();
  return page.getByRole("dialog");
}

async function buscarNaLista(page: Page, termo: string) {
  await page.getByRole("button", { name: "Lista", exact: true }).click();
  await page.getByPlaceholder(/Buscar evento/i).fill(termo);
}

test("cria evento, edita e persiste após refresh", async ({ page }) => {
  // 1. Criar
  const d = await abrirNovoEvento(page);
  await d.locator('input[name="titulo"]').fill(EVT);
  await d.locator('input[name="inicio"]').fill("2026-07-16T10:00");
  await d.locator('input[name="fim"]').fill("2026-07-16T11:00");
  await d.getByRole("button", { name: "Criar evento" }).click();
  await expect(d).toHaveCount(0);

  // 2. Aparece na lista (busca sem recorte de mês)
  await buscarNaLista(page, RUN);
  await expect(page.getByText(EVT, { exact: true })).toBeVisible();

  // 3. Refresh → persiste
  await page.reload();
  await buscarNaLista(page, RUN);
  await expect(page.getByText(EVT, { exact: true })).toBeVisible();

  // 4. Editar (abre pelo lápis, troca horário) e salva
  await page.getByRole("button", { name: "Editar" }).click();
  const e = page.getByRole("dialog");
  await expect(e).toBeVisible();
  await e.locator('input[name="inicio"]').fill("2026-07-16T14:00");
  await e.locator('input[name="fim"]').fill("2026-07-16T15:00");
  await e.getByRole("button", { name: /Salvar|Atualizar/ }).click();
  await expect(e).toHaveCount(0);

  // 5. Refresh → reabre e confirma o novo horário persistido
  await page.reload();
  await buscarNaLista(page, RUN);
  await page.getByRole("button", { name: "Editar" }).click();
  const e2 = page.getByRole("dialog");
  await expect(e2.locator('input[name="inicio"]')).toHaveValue("2026-07-16T14:00");
});

test("avisa conflito de horário ao sobrepor eventos (só avisa, não bloqueia)", async ({ page }) => {
  // Evento base
  const d1 = await abrirNovoEvento(page);
  await d1.locator('input[name="titulo"]').fill(`${EVT} base`);
  await d1.locator('input[name="inicio"]').fill("2026-07-17T14:00");
  await d1.locator('input[name="fim"]').fill("2026-07-17T15:00");
  await d1.getByRole("button", { name: "Criar evento" }).click();
  await expect(d1).toHaveCount(0);

  // Evento sobreposto → o formulário mostra o aviso de conflito
  const d2 = await abrirNovoEvento(page);
  await d2.locator('input[name="titulo"]').fill(`${EVT} sobreposto`);
  await d2.locator('input[name="inicio"]').fill("2026-07-17T14:30");
  await d2.locator('input[name="fim"]').fill("2026-07-17T15:30");
  await expect(d2.getByText("Conflito de horário")).toBeVisible();
  // Não bloqueia: salva mesmo assim
  await d2.getByRole("button", { name: "Criar evento" }).click();
  await expect(d2).toHaveCount(0);

  // A grade avisa o conflito no período (semana atual contém 17/07)
  await page.goto("/agenda");
  await expect(page.getByText(/conflito de horário/i).first()).toBeVisible();
});
