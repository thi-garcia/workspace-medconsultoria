/**
 * Supervisor "sempre no ar" do Workspace MedConsultoria.
 *
 * Sobe `pnpm dev` (API + Web) e o RE-SOBE automaticamente se cair — a aplicação
 * nunca fica fora do ar por um crash. Roda destacado (nohup/Start-Process) e
 * sobrevive entre sessões.
 *
 * Modo pausa (para regenerar o Prisma sem o supervisor brigar pelo lock):
 *   - crie o arquivo  scripts/.keepalive-pause   → o supervisor para o dev e espera
 *   - apague o arquivo                            → o supervisor volta a subir o dev
 *
 * Log em: scripts/.keepalive.log   |   PID do supervisor em: scripts/.keepalive.pid
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const PAUSE = join(here, ".keepalive-pause");
const LOG = join(here, ".keepalive.log");
const PIDFILE = join(here, ".keepalive.pid");

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    appendFileSync(LOG, line);
  } catch {
    /* log é best-effort */
  }
  process.stdout.write(line);
};

writeFileSync(PIDFILE, String(process.pid));

let child = null;
let parando = false;
let spawning = false;
let restarts = 0;
let ultimoStart = 0;

function pararFilho() {
  if (!child || child.killed) return;
  const pid = child.pid;
  child = null;
  // Mata a árvore de processos (turbo → api + web) no Windows.
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", shell: true });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      /* já morreu */
    }
  }
}

function subir() {
  // Idempotente: nunca sobe dois 'pnpm dev' (evita corrida entre o exit e o vigia).
  if (parando || child || spawning) return;
  if (existsSync(PAUSE)) {
    setTimeout(subir, 3000);
    return;
  }
  spawning = true;
  ultimoStart = Date.now();
  log(`▶️  subindo 'pnpm dev' (reinícios até agora: ${restarts})`);
  child = spawn("pnpm", ["dev"], {
    cwd: root,
    shell: true,
    windowsHide: true,
    detached: process.platform !== "win32",
    stdio: ["ignore", "inherit", "inherit"],
  });
  spawning = false;

  child.on("exit", (code, signal) => {
    if (parando) return;
    child = null;
    // Se caiu muito rápido, espera mais (evita loop de crash apertado).
    const viveu = Date.now() - ultimoStart;
    const espera = viveu < 8000 ? 6000 : 1500;
    restarts++;
    log(`⚠️  dev caiu (code=${code} signal=${signal}, viveu ${Math.round(viveu / 1000)}s) — re-subindo em ${espera}ms`);
    setTimeout(subir, espera);
  });
}

// Vigia o arquivo de pausa: se aparecer, derruba o dev; se sumir, volta.
setInterval(() => {
  if (parando) return;
  const pausado = existsSync(PAUSE);
  if (pausado && child) {
    log("⏸️  pausa detectada — parando o dev");
    pararFilho();
  } else if (!pausado && !child) {
    subir();
  }
}, 2000);

function encerrar() {
  parando = true;
  log("🛑 supervisor encerrando — parando o dev");
  pararFilho();
  try {
    unlinkSync(PIDFILE);
  } catch {
    /* ok */
  }
  setTimeout(() => process.exit(0), 800);
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

log("🟢 supervisor iniciado");
subir();
