export const appShellHtml = `
  <div class="layout">

  <header class="topbar">

    <h1>
      Hoheckell's Command Palette
    </h1>

  </header>

  <section class="toolbar">

    <button
      id="open-help"
      title="Abrir ajuda da aplicação"
    >
      ❔
    </button>

    <button
      id="capture-terminal"
      title="Conectar um terminal Linux"
    >
      ⛓
    </button>

    <button
      id="disconnect-terminal"
      title="Desconectar terminal atual"
    >
      ⛔
    </button>

    <button
      id="save-history"
      title="Salvar histórico completo"
    >
      💾
    </button>
    <button
  id="view-saved-history"
  title="Ver histórico salvo"
>
  📚
</button>

<button
  id="view-saved-commands"
  title="Ver comandos salvos"
>
  ⌘
</button>

<button
  id="view-saved-helps"
  title="Ver helps salvos"
>
  📖
</button>

<button
  id="open-command-builder"
  title="Abrir assistente de composição"
>
  🧱
</button>
<button
  id="configure-ai"
  title="Configurar OpenRouter"
>
  🤖
</button>
    <label class="theme-switch">

  <input
    type="checkbox"
    id="theme-toggle"
  />

  <span>
    🌙
  </span>

</label>

  </section>

  <div id="tldr-status"></div>
  <div id="ai-status"></div>
  <section class="search-section">

    <input
      id="search"
      placeholder="Buscar comandos..."
    />

  </section>

  <div id="command-help"></div>

  <section class="history-section">

    <ul id="history"></ul>

  </section>

  <div id="app-help"></div>
  <div id="saved-modal"></div>
  <div id="builder-modal"></div>

</div>
`
