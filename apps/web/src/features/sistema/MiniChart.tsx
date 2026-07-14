/**
 * Gráficos minúsculos em SVG inline — zero dependências. Área para séries
 * temporais e barra de proporção para gauges. Responsivos (viewBox + width 100%).
 */

export function AreaMini({
  dados,
  cor = "text-primary",
  altura = 44,
}: {
  dados: number[];
  cor?: string;
  altura?: number;
}) {
  if (dados.length < 2) {
    return (
      <div
        style={{ height: altura }}
        className="flex items-center justify-center text-[11px] text-muted-foreground"
      >
        coletando dados…
      </div>
    );
  }
  const w = 100;
  const h = altura;
  const max = Math.max(...dados, 1);
  const min = Math.min(...dados, 0);
  const range = max - min || 1;
  const pts = dados.map((v, i) => {
    const x = (i / (dados.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const linha = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${linha} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className={cor}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: altura }}
      >
        <path d={area} fill="currentColor" opacity={0.12} />
        <path d={linha} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/** Barra de proporção (gauge) com faixas de cor por severidade. */
export function BarraUso({ pct, label }: { pct: number; label?: string }) {
  const p = Math.min(100, Math.max(0, pct));
  const cor = p >= 90 ? "bg-destructive" : p >= 75 ? "bg-warning" : "bg-success";
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{p}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
