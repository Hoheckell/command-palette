# Hoheckell's Command Palette

Navegador de comandos de terminal para Linux com histórico pesquisável, documentação TLDR e execução no terminal conectado.

## Funcionalidades

- Carrega histórico do `~/.bash_history`
- Busca fuzzy com Fuse.js
- Documentação TLDR para comandos
- Explicação aprofundada com IA (OpenRouter)
- Execução de comandos no terminal via xdotool
- Biblioteca local em SQLite para comandos salvos
- Tema claro/escuro

## Stack

- Tauri v2 (Rust + TypeScript)
- Vite + Vitest + Playwright
- SQLite (rusqlite)

## Requisitos (Linux)

- Node.js 22+
- Rust (toolchain estável)
- Dependências de build Tauri/WebKitGTK
- `xdotool` (para execução no terminal conectado)

## Desenvolvimento

```bash
npm ci
npm run tauri dev
```

## Testes

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run test:ci
```

`test:ci` roda o mesmo fluxo validado no GitHub Actions: typecheck + unit + e2e.

## CI (GitHub Actions)

- Workflow: `.github/workflows/ci.yml`
- Gatilhos: `push` na `main`, `pull_request` e `workflow_dispatch`
- Jobs:
  - Unit + typecheck com cobertura
  - E2E com Playwright (Chromium)
- Artefatos publicados:
  - `coverage-report`
  - `playwright-report` e `test-results`

## Release Linux (primeiro release open source)

- Workflow: `.github/workflows/release.yml`
- Gatilhos: tag `v*` e `workflow_dispatch`
- Build alvo: `x86_64-unknown-linux-gnu`
- Pacotes publicados no GitHub Release:
  - `.deb`
  - `.AppImage`

### Como publicar

1. Atualize versão e changelog.
2. Crie e envie a tag:

```bash
git tag v0.3.0
git push origin v0.3.0
```

3. O workflow `Release Linux` cria os binários e anexa os artefatos automaticamente no release da tag.
