# Hoheckell's Command Palette

Navegador de comandos de terminal com integração TLDR. Transforma seu histórico do shell em uma biblioteca pesquisável.

## Funcionalidades

- Carrega histórico do `~/.bash_history`
- Busca fuzzy com Fuse.js
- Documentação TLDR para comandos
- Execução de comandos no terminal via xdotool
- Banco SQLite local para salvar comandos favoritos
- Tema claro/escuro

## Desenvolvimento

```bash
npm install
npm run tauri dev
```

## Testes

```bash
npm run test:unit    # unitarios com cobertura
npm run test:e2e     # fluxo no navegador com Playwright
npm run test:ci      # typecheck + unit + e2e
```

O CI roda em pull requests e pushes na branch `main`, publica o artefato de cobertura e o relatorio do Playwright.

## Release

```bash
npm run release:patch   # v0.1.0 -> v0.1.1
npm run release:minor   # v0.1.0 -> v0.2.0
npm run release:major   # v0.1.0 -> v1.0.0
```

Isso cria uma tag git e faz push. O GitHub Actions constrói os binários automaticamente.

## Stack

- Tauri v2 (Rust + TypeScript)
- SQLite (rusqlite)
- TLDR (documentação comunitária)
- xdotool (controle de janelas Linux)
