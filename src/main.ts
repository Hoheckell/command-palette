import './style.css'
import Fuse from 'fuse.js'
import { createFavoritesStore } from './features/history/favorites-store'
import { SavedCommandsCache } from './features/history/saved-commands-cache'
import { renderHistoryList } from './features/history/history-list'
import { openSavedCommandsModal } from './features/history/saved-commands-modal'
import { openSavedHistoryModal } from './features/history/saved-history-modal'
import { showCommandHelp } from './features/help/command-help'
import { openAppHelp } from './features/help/app-help'
import { openSavedModal } from './features/modal/saved-modal'
import { appShellHtml } from './app-shell'
import { getAppDomRefs } from './dom-refs'
import { tauriApi } from './services/tauri-api'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = appShellHtml
async function checkTldr() {
  console.log('Carregando TLDR')
  const installed =
    await tauriApi.hasTldr()

  if (installed) {

    tldrStatus.innerHTML = `
      <div class="tldr-row">

        <span class="dot green"></span>

        <span>
          TLDR instalado
        </span>

      </div>
    `

    return
  }

  tldrStatus.innerHTML = `
    <div class="tldr-row">

      <span class="dot red"></span>

      <span>
        TLDR não instalado
      </span>

      <button id="install-tldr">
        Instalar
      </button>

    </div>
  `

  const installButton = document.querySelector('#install-tldr') as HTMLButtonElement

  installButton.onclick = async () => {

    installButton.innerText =
      'Instalando...'

    installButton.disabled = true

    try {

      await tauriApi.installTldr()

      await checkTldr()

    } catch (err) {

      console.error(err)

      installButton.innerText =
        'Erro'

      alert(String(err))
    }
  }
}

const {
  viewSavedHistoryButton,
  viewSavedCommandsButton,
  viewSavedHelpsButton,
  helpContainer,
  openHelpButton,
  commandHelp,
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

  return fuse.search(value).map(r => r.item)
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
    captureButton.innerText = 'Clique no terminal...'

    setTimeout(async () => {
      try {
        const id = await tauriApi.saveTerminalWindow()
        captureButton.innerText = `Terminal conectado (${id})`
      } catch (err) {
        console.error(err)
        captureButton.innerText = 'Erro ao conectar'
      }
    }, 3000)
  }

  disconnectButton.onclick = async () => {
    try {
      await tauriApi.disconnectTerminal()
      captureButton.innerText = 'Capturar terminal'
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

function bootstrap() {
  setupTheme()
  bindEvents()
  checkTldr()
  loadHistory()
}

console.log('App iniciado')
bootstrap()
