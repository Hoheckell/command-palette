# Contribuindo para o Command Palette

Primeiramente, obrigado por considerar contribuir com este projeto! ❤️

Este guia descreve como contribuir de forma eficiente e respeitosa.

---

## Código de Conduta

Ao contribuir, você concorda em manter um ambiente acolhedor e respeitoso para todos. Não serão tolerados comentários ofensivos, assédio ou qualquer forma de discriminação.

---

## Como contribuir

### Reportando bugs

1. Verifique se o bug já foi reportado nas [issues](https://github.com/Hoheckell/command-palette/issues)
2. Caso contrário, [abra uma nova issue](https://github.com/Hoheckell/command-palette/issues/new)
3. Descreva o comportamento esperado vs. observado
4. Inclua informações do ambiente (distro, versão, WM, versão do app)
5. Adicione logs do terminal se possível (`RUST_LOG=debug`)

### Sugerindo funcionalidades

Abra uma [issue de sugestão](https://github.com/Hoheckell/command-palette/issues/new) descrevendo:
- o problema que você quer resolver
- como você imagina a solução
- exemplos de uso

### Enviando código

1. Faça um **fork** do repositório
2. Crie sua branch de feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```
   Use prefixos como `feature/`, `fix/`, `refactor/`, `docs/`.
3. Faça suas alterações seguindo o estilo do projeto
4. Rode os testes e verificação de tipos:
   ```bash
   npm run typecheck
   npm run test:unit
   ```
5. Commit suas alterações:
   ```bash
   git commit -m 'feat: adiciona nova funcionalidade incrível'
   ```
   Usamos [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` — nova funcionalidade
   - `fix:` — correção de bug
   - `refactor:` — refatoração sem mudança de comportamento
   - `docs:` — documentação
   - `test:` — testes
   - `chore:` — tarefas de manutenção
   - `style:` — formatação, estilos
6. Envie para seu fork:
   ```bash
   git push origin feature/nome-da-feature
   ```
7. Abra um **Pull Request** para o branch `main`

---

## Setup de desenvolvimento

### Pré-requisitos

- **Node.js** >= 22
- **npm**
- **Rust** (stable) — [rustup](https://rustup.rs/)
- **Dependências Linux** (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Instalação

```bash
git clone https://github.com/Hoheckell/command-palette.git
cd command-palette
npm install
```

### Rodando em desenvolvimento

```bash
npm run tauri dev
```

Isso abre a janela do Tauri com hot-reload no frontend.

---

## Testes

O projeto usa **Vitest** para testes unitários e **Playwright** para E2E.

```bash
# Typecheck (TypeScript)
npm run typecheck

# Testes unitários com cobertura
npm run test:unit

# Testes E2E (Playwright)
npm run test:e2e

# Tudo de uma vez
npm run test:ci
```

Sempre rode `npm run test:ci` antes de abrir um PR.

---

## Estrutura do projeto

```
├── src/                    # Frontend TypeScript
│   ├── features/           # Módulos por funcionalidade
│   ├── services/           # Serviços (API, IA, etc.)
│   ├── shared/             # Utilitários compartilhados
│   ├── ai.ts               # Integração com IA
│   ├── app-shell.ts        # Componente principal
│   └── dom-refs.ts         # Referências do DOM
├── src-tauri/              # Backend Rust (Tauri)
├── tests/                  # Testes E2E
└── dist/                   # Build de produção
```

---

## Estilo de código

- TypeScript: tipagem estrita (`strict: true`)
- Nomes em inglês para código, comentários em português se necessário
- Sempre prefira imutabilidade e funções puras
- Siga os padrões já existentes no projeto

---

## Commits e PRs

- Título do PR em inglês, descrição pode ser em português
- Referencie issues relacionadas: `Closes #123`
- Mantenha PRs focados em uma única mudança
- PRs grandes demais podem ser rejeitados — prefira PRs pequenos e frequentes

---

## Release

O processo de release é automatizado via GitHub Actions. Basta criar uma tag `v*`:

```bash
git tag v0.4.0
git push origin v0.4.0
```

Isso gera `.deb`, `.rpm` e `.AppImage` automaticamente.

---

## Dúvidas?

Abra uma [discussion](https://github.com/Hoheckell/command-palette/discussions) ou issue.
