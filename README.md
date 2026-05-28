# Hoheckell's Command Palette

[![Linux](https://img.shields.io/badge/Linux-X11-green?style=flat-square)](https://github.com/Hoheckell/command-palette)
[![Rust](https://img.shields.io/badge/Rust-Tauri-orange?style=flat-square)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue?style=flat-square)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-Local-lightgrey?style=flat-square)](https://sqlite.org)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Hoheckell/command-palette/ci.yml?style=flat-square&label=CI)](https://github.com/Hoheckell/command-palette/actions)
[![Release](https://img.shields.io/github/v/release/Hoheckell/command-palette?style=flat-square)](https://github.com/Hoheckell/command-palette/releases)

Transformando histórico Linux em uma biblioteca operacional inteligente.

---

## Sobre o projeto

O **Hoheckell's Command Palette** é uma aplicação desktop Linux construída com [Tauri](https://tauri.app) (Rust + TypeScript) e SQLite que transforma o histórico do terminal em uma ferramenta pesquisável, reutilizável e educativa.

O objetivo é permitir que usuários Linux possam:
- pesquisar rapidamente comandos antigos
- reutilizar operações recorrentes
- consultar documentação integrada (TLDR)
- salvar e favoritar comandos importantes
- aprender comandos Linux através de explicações contextualizadas com IA opcional

---

## Principais funcionalidades

### Histórico pesquisável

Busca instantânea no histórico Bash/ZSH.

![Busca](https://github.com/user-attachments/assets/7b3025ab-a2a5-4bc9-9e9b-b571d37408d6)

---

### Execução integrada no terminal

Envia comandos diretamente para o terminal conectado usando:
- xdotool
- wmctrl

Compatível atualmente com:
- Ubuntu
- Linux Mint
- Debian
- ambientes X11

---

### Documentação TLDR integrada

Busca automática das páginas oficiais TLDR:
- sem dependência externa
- sem instalação de Node.js
- cache local automático
- funcionamento offline após primeiro acesso

![TLDR](https://github.com/user-attachments/assets/9c1d4ca7-9951-435b-86cb-148342fbfdd5)

---

### Favoritos e biblioteca pessoal

Permite:
- salvar comandos
- favoritar comandos
- salvar documentação
- construir uma biblioteca operacional local

Tudo armazenado em SQLite.

---

### Explicações aprofundadas com IA

Integração opcional com IA para:
- explicar comandos
- detalhar flags
- apresentar exemplos reais
- mostrar riscos e boas práticas

---

### Tema claro e escuro

Interface adaptável com suporte completo a:
- dark theme
- light theme

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Rust + Tauri 2 |
| Frontend | TypeScript + HTML + CSS |
| Armazenamento | SQLite (local) |
| Integração Linux | xdotool, wmctrl, pkexec |

---

## Instalação

### Pré-compilado (recomendado)

Baixe o instalador da sua distribuição na [página de releases](https://github.com/Hoheckell/command-palette/releases):

- **Debian/Ubuntu**: `.deb`
- **Fedora/RHEL**: `.rpm`
- **Qualquer distro**: `.AppImage`

```bash
# AppImage
chmod +x HoheckellsCommandPalette-*.AppImage
./HoheckellsCommandPalette-*.AppImage
```

```bash
# Debian/Ubuntu
sudo dpkg -i hoheckells-command-palette_*.deb
```

### Compilar do fonte

```bash
# 1. Pré-requisitos (Debian/Ubuntu)
sudo apt install libwebkit2gtk-4.1-dev libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev rpm

# 2. Clone e compile
git clone https://github.com/Hoheckell/command-palette.git
cd command-palette
npm install
npm run tauri build
```

O binário estará em `src-tauri/target/release/`.

---

## Desenvolvimento

### Pré-requisitos

- Node.js 22+
- Rust toolchain (via rustup)
- Dependências Linux (listadas acima)

### Comandos

```bash
npm run tauri dev     # iniciar em modo desenvolvimento
npm run typecheck     # verificar tipos TypeScript
npm run test:unit     # testes unitários (Vitest)
npm run test:e2e      # testes end-to-end (Playwright)
npm run test:ci       # suite completa (typecheck + unit + e2e)
```

### Estrutura do projeto

```
src-tauri/            # Backend Rust (Tauri)
  src/                #   comandos e lógica
  icons/              #   ícones do app
src/                  # Frontend TypeScript
  components/         #   componentes de UI
  lib/                #   utilitários
test/                 # Testes E2E (Playwright)
```

---

## Contribuindo

Contribuições são bem-vindas! Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para guia completo sobre:

- Reportar bugs e sugerir funcionalidades
- Fluxo de contribuição (fork → branch → commit → PR)
- Conventional Commits
- Padrões de código
- Processo de release

---

## Distribuições suportadas

| Distribuição | Status |
|-------------|--------|
| Ubuntu | ✅ Testado |
| Linux Mint | ✅ Testado |
| Debian | ✅ Testado |
| Pop!_OS | ✅ Testado |
| Fedora | ⚠️ Experimental (rpm) |

**Requisitos:** X11, wmctrl, xdotool

---

## Licença

Distribuído sob licença MIT. Veja [LICENSE](LICENSE) para mais informações.
