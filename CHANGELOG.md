# Changelog

## [0.2.0] - 2026-05-25

### Adicionado

- Botão "Alterar" ao lado do status "IA configurada" para trocar a API key do OpenRouter
- Estilo específico para `#save-command` no modal de ajuda

### Alterado

- Seção de ajuda "O que é TLDR?" atualizada para "Documentação TLDR" — remove menção de instalação, esclarece que a documentação é obtida via API automaticamente
- Objetivo do projeto na ajuda atualizado para refletir documentação TLDR automática via API

## [0.1.0] - 2026-05-23

### Adicionado

- Carregamento do histórico do shell (`~/.bash_history`)
- Busca fuzzy com Fuse.js
- Integração com TLDR para documentação de comandos
- Conexão com terminal via xdotool para executar comandos
- Salvamento de comandos favoritos em banco SQLite local
- Salvamento de histórico completo no banco local
- Visualização de comandos salvos, histórico salvo e helps salvos
- Instalação automatizada do TLDR via npm
- Tema claro/escuro com persistência em localStorage
- Modal de ajuda explicando o funcionamento da aplicação
