# Hoheckell's Command Palette

Transformando histórico Linux em uma biblioteca operacional inteligente.

![Linux](https://img.shields.io/badge/Linux-X11-green)
![Rust](https://img.shields.io/badge/Rust-Tauri-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue)
![SQLite](https://img.shields.io/badge/SQLite-Local%20Database-lightgrey)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## Sobre o projeto

O Hoheckell's Command Palette é uma aplicação desktop Linux construída com Tauri, Rust, TypeScript e SQLite que transforma o histórico do terminal em uma ferramenta pesquisável, reutilizável e educativa.

O objetivo é permitir que usuários Linux possam:
- pesquisar rapidamente comandos antigos
- reutilizar operações recorrentes
- consultar documentação integrada
- salvar comandos importantes
- aprender comandos Linux através de explicações contextualizadas

---

## Principais funcionalidades

### Histórico pesquisável

Busca instantânea no histórico Bash/ZSH.

![Busca](./screenshots/search.png)

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

![TLDR](./screenshots/tldr.png)

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

## Tecnologias utilizadas

### Backend
- Rust
- Tauri
- SQLite

### Frontend
- TypeScript
- HTML
- CSS

### Linux integration
- xdotool
- wmctrl
- pkexec

---

## Distribuições suportadas

Melhor experiência atualmente em:
- Ubuntu
- Linux Mint
- Debian
- Pop!_OS

Requisitos:
- X11
- wmctrl
- xdotool

---

## Instalação

### AppImage

Baixe o `.AppImage` na página de releases:

```bash
chmod +x HoheckellsCommandPalette.AppImage
./HoheckellsCommandPalette.AppImage