# brand/ — Identidade visual da MedConsultoria

Coloque aqui os materiais de marca. Eu uso estes arquivos para aplicar a identidade na aplicação (logo no login/sidebar, cores, favicon, etc.).

## Estrutura sugerida

```
brand/
├── logos/          → logotipos em várias versões
│   ├── principal/      (logo colorido padrão)
│   ├── mono-claro/     (versão branca — para fundos escuros, ex.: a sidebar azul)
│   ├── mono-escuro/    (versão escura — para fundos claros)
│   ├── simbolo/        (só o símbolo/ícone, sem texto — vira o favicon)
│   └── favicon/        (ico/png/svg do ícone)
├── identidade/     → manual da marca, guia de cores, tipografia (PDF, etc.)
└── outros/         → qualquer material extra (papelaria, apresentações…)
```

## Formatos ideais (do melhor para o pior)

- **SVG** (vetorial, escala sem perder qualidade) — o ideal para logos na web.
- **PNG com fundo transparente** — bom para logos coloridos e o símbolo.
- PDF/AI/EPS — servem como fonte; eu extraio o que precisar.

## Dica de nomes

Use nomes claros, ex.: `medconsultoria-horizontal-cor.svg`, `medconsultoria-simbolo-branco.png`,
`favicon-512.png`. Sem espaços/acentos ajuda (use `-` no lugar).

> Quando você colocar os arquivos, me avise ("coloquei os logos em brand/") que eu aplico
> na aplicação: troco o "M" placeholder pelo logo real no login e na sidebar, ajusto o
> favicon e confiro as cores contra o manual da marca.
