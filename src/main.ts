import './style.css'
import Fuse from 'fuse.js'
import { createFavoritesStore } from './features/history/favorites-store'
import { SavedCommandsCache } from './features/history/saved-commands-cache'
import { renderHistoryList } from './features/history/history-list'
import { openSavedCommandsModal } from './features/history/saved-commands-modal'
import { openSavedHistoryModal } from './features/history/saved-history-modal'
import { showCommandHelp } from './features/help/command-help'
import { openAppHelp } from './features/help/app-help'
import { openCommandBuilderModal } from './features/builder/command-builder-modal'
import { openSavedModal } from './features/modal/saved-modal'
import { appShellHtml } from './app-shell'
import { getAppDomRefs } from './dom-refs'
import { tauriApi } from './services/tauri-api'
import { showToast } from './services/toast' 

document.querySelector<HTMLDivElement>('#app')!.innerHTML = appShellHtml
async function checkTldr() {

  const online = await tauriApi.hasInternet()

  if (online) {

    tldrStatus.innerHTML = `

      <div class="tldr-row">

        <span class="dot green"></span>

        <span>
          TLDR online disponível
        </span>

      </div>
    `

  } else {

    tldrStatus.innerHTML = `

      <div class="tldr-row">

        <span class="dot yellow"></span>

        <span>
          Modo offline
        </span>

      </div>
    `
  }
}


const {
  viewSavedHistoryButton,
  viewSavedCommandsButton,
  viewSavedHelpsButton,
  openCommandBuilderButton,
  helpContainer,
  openHelpButton,
  commandHelp,
  builderModal,
  tldrStatus,
  disconnectButton,
  captureButton,
  historyList,
  searchInput,
  saveHistoryButton,
  themeToggle
} = getAppDomRefs()


let allCommands: string[] = []

const favoritesStorageKey = 'favorite-history-commands'

const favoritesStore = createFavoritesStore(favoritesStorageKey)

const savedCommandsCache = new SavedCommandsCache()

let fuse: Fuse<string>

function setupTheme() {
  const savedTheme = localStorage.getItem('theme')

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme')
    themeToggle.checked = true
  }

  themeToggle.onchange = () => {
    if (themeToggle.checked) {
      document.body.classList.add('light-theme')
      localStorage.setItem('theme', 'light')
      return
    }

    document.body.classList.remove('light-theme')
    localStorage.setItem('theme', 'dark')
  }
}

function getVisibleCommands() {
  const value = searchInput.value.trim()

  if (!value) {
    return allCommands
  }

  const results = fuse.search(value).map(r => r.item)
  if(results.length > 0) {
    getAppDomRefs().searchTldrButton.classList.add('hidden')    
  } else {
    getAppDomRefs().searchTldrButton.classList.remove('hidden')
  }

  getAppDomRefs().searchTldrButton.onclick = async () => { 
    await showCommandHelp(commandHelp, value)
  }

  return results
}

function rerenderCurrentList() {
  renderHistoryList(getVisibleCommands(), {
    historyList,
    favoritesStore,
    savedCommandsCache,
    onSaveCommand: async command => {
      await saveHistoryCommand(command)
    },
    onDeleteCommand: async id => {
      await tauriApi.deleteSavedCommand(id)
      await savedCommandsCache.sync()
    },
    onRunCommand: async command => {
      await tauriApi.runCommand(command)
    },
    onShowCommandHelp: async command => {
      await showCommandHelp(commandHelp, command)
    },
    onFavoriteAdded: async command => {
      await saveHistoryCommand(command)
    },
    onAfterStateChange: () => {
      rerenderCurrentList()
    }
  })
}

async function saveHistoryCommand(command: string) {
  await tauriApi.saveCommand(command, '', 'history')

  await savedCommandsCache.sync()
}

function bindEvents() {
  saveHistoryButton.onclick = async () => {
    try {
      await tauriApi.saveHistory(allCommands)

      saveHistoryButton.innerText = 'Histórico salvo'
    } catch (err) {
      console.error(err)
      saveHistoryButton.innerText = 'Erro'
    }
  }

  searchInput.addEventListener('input', () => {
    rerenderCurrentList()
  })

  captureButton.onclick = async () => {
    showToast('Clique no terminal que deseja conectar...', 'info')

    setTimeout(async () => {
      try {
        const id = await tauriApi.saveTerminalWindow()
        showToast(`Terminal conectado (${id})`, 'success')
      } catch (err) {
        console.error(err)
        showToast('Erro ao conectar no terminal', 'error')
      }
    }, 3000)
  }

  disconnectButton.onclick = async () => {
    try {
      await tauriApi.disconnectTerminal()
      showToast('Terminal desconectado', 'info')
    } catch (err) {
      console.error(err)
    }
  }

  openHelpButton.onclick = () => {
    openAppHelp(helpContainer)
  }

  viewSavedCommandsButton.onclick = async () => {
    await openSavedCommandsModal({
      openSavedModal,
      savedCommandsCache,
      rerenderCurrentList
    })
  }

  viewSavedHelpsButton.onclick = async () => {
    await openSavedCommandsModal({
      openSavedModal,
      savedCommandsCache,
      rerenderCurrentList
    })
  }

  viewSavedHistoryButton.onclick = async () => {
    await openSavedHistoryModal({
      openSavedModal,
      savedCommandsCache,
      rerenderCurrentList
    })
  }

  openCommandBuilderButton.onclick = () => {
    openCommandBuilderModal({
      container: builderModal,
      onRunCommand: async command => {
        await tauriApi.runCommand(command)
      },
      onSaveCommand: async command => {
        await saveHistoryCommand(command)
      }
    })
  }
}

async function loadHistory() {
  const commands = await tauriApi.getHistory()

  const uniqueCommands = [...new Set(commands.reverse())]

  allCommands = uniqueCommands

  fuse = new Fuse(allCommands, {
    threshold: 0.4
  })

  await savedCommandsCache.sync()

  rerenderCurrentList()
}

function openAIConfig() {

  helpContainer.innerHTML = `

    <div class="help-overlay">

      <div class="help-modal">

        <div class="help-modal-top">

          <h2>
            Configurar IA
          </h2>

          <button id="close-ai-config">
            ✕
          </button>

        </div>

        <div class="help-content">

          <p>
            Informe sua API key OpenRouter.
          </p>

          <p>
            Modelos gratuitos serão usados.
          </p>

          <input
            id="openrouter-key"
            type="password"
            placeholder="sk-or-..."
          />

          <button id="save-openrouter-key">
            Salvar
          </button>

        </div>

      </div>

    </div>
  `

  attachAIConfigEvents()
}
function attachAIConfigEvents() {

  const close = document.querySelector('#close-ai-config') as HTMLButtonElement | null

  if (close) {

    close.onclick = () => {

      helpContainer.innerHTML = ''
    }
  }

  const save = document.querySelector('#save-openrouter-key') as HTMLButtonElement | null

  if (save) {

    save.onclick = () => {

      const input = document.querySelector('#openrouter-key') as HTMLInputElement | null

      if (!input) return;

      localStorage.setItem(
        'openrouter_api_key',
        input.value
      )

      helpContainer.innerHTML = ''

      checkAI()
    }
  }
}

function checkSystem() {
    tauriApi.detectPackageManager().then((packageManager) => {
      if (packageManager == "apt") {
        getAppDomRefs().systemDetect.innerHTML = `
          <div class="tldr-row">
            <span class="dot green"></span>
            <span>Sistema: Ubuntu/Debian (${packageManager})</span>
          </div>
        `
      } else if (packageManager == "dnf") {
        getAppDomRefs().systemDetect.innerHTML = `
          <div class="tldr-row">
            <span class="dot green"></span>
            <span>Sistema: Fedora/RHEL (${packageManager})</span>
          </div>
        `
      } else if (packageManager == "pacman") {
        getAppDomRefs().systemDetect.innerHTML = `
          <div class="tldr-row">
            <span class="dot green"></span>
            <span>Sistema: Arch Linux (${packageManager})</span>
          </div>
        `
      } else if (packageManager == "zypper") {
        getAppDomRefs().systemDetect.innerHTML = `
          <div class="tldr-row">
            <span class="dot green"></span>
            <span>Sistema: SUSE/openSUSE (${packageManager})</span>
          </div>
        `
      } else {
        getAppDomRefs().systemDetect.innerHTML = `
          <div class="tldr-row">
            <span class="dot red"></span>
            <span>Sistema: Desconhecido</span>
          </div>
        `
      }
    })
  }

function checkAI() {

  const hasKey =
    !!localStorage.getItem(
      'openrouter_api_key'
    )

  if (hasKey) {

    getAppDomRefs().aiStatus.innerHTML = `

      <div class="tldr-row">

        <span class="dot green"></span>

        <span>
          IA configurada
        </span>

        <button id="change-ai-key">
          Alterar
        </button>

      </div>
    `

    const changeBtn = document.querySelector('#change-ai-key') as HTMLButtonElement | null

    if (changeBtn) {

      changeBtn.onclick = () => {

        openAIConfig()
      }
    }

  } else {

    getAppDomRefs().aiStatus.innerHTML = `

      <div class="tldr-row">

        <span class="dot red"></span>

        <span>
          IA não configurada
        </span>

        <button id="setup-ai">
          Configurar
        </button>

      </div>
    `

    const button = document.querySelector('#setup-ai') as HTMLButtonElement | null

    if (button) {

      button.onclick = () => {

        openAIConfig()
      }
    }
  }
}

async function checkXdotool() {

  const installed = await tauriApi.hasXdotool()

  if (installed) {

    getAppDomRefs().terminalStatus.innerHTML = `

      <div class="tldr-row">

        <span class="dot green"></span>

        <span>
          Execução terminal disponível
        </span>

      </div>
    `

    return;
  }

  getAppDomRefs().terminalStatus.innerHTML = `

    <div class="tldr-row">

      <span class="dot red"></span>

      <span>
        xdotool não instalado
      </span>

      <button id="install-xdotool">

        Instalar

      </button>

    </div>
  `

  const button =
    document.querySelector(
      '#install-xdotool'
    ) as HTMLButtonElement | null

  if (button) {

    button.onclick = async () => {

      button.innerText =
        'Instalando...'

      try {

        await tauriApi.installXdotool()

        await checkXdotool()

      } catch (err) {

        console.error(err)

        button.innerText =
          'Erro'
      }
    }
  }
}

document
  .querySelectorAll('.help-command')
  .forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        const command =
          (button as HTMLButtonElement)
            .dataset.command

        if (!command) return;
      }
    );
  });

function bootstrap() {
  setupTheme()
  bindEvents()
  checkTldr()
  checkXdotool()
  checkAI()
  checkSystem()
  loadHistory()
}

console.log('App iniciado')
bootstrap()
