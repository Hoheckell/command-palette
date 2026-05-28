import { tauriApi } from '../../services/tauri-api'

interface OpenHiddenCommandsModalDeps {
  openSavedModal: (title: string, content: string) => void
  rerenderCurrentList: () => void
  hiddenCommandsCache: { sync: () => Promise<void> }
}

export async function openHiddenCommandsModal(deps: OpenHiddenCommandsModalDeps) {
  const { openSavedModal, rerenderCurrentList, hiddenCommandsCache } = deps

  const commands = await tauriApi.getHiddenCommands()

  if (commands.length === 0) {
    openSavedModal('Comandos ocultos', 'Nenhum comando oculto ainda.')
    return
  }

  openSavedModal(
    'Comandos ocultos',
    commands
      .map(command => {
        return `
        <div class="history-item">
          <span class="history-command">${command}</span>
          <button class="unhide-command" data-command="${command}" title="Reativar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Reativar</span>
          </button>
        </div>
      `
      })
      .join('')
  )

  const unhideButtons = document.querySelectorAll('.unhide-command')

  unhideButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const command = (button as HTMLButtonElement).dataset.command

        if (command) {
          await tauriApi.unhideCommand(command)
          await hiddenCommandsCache.sync()
          rerenderCurrentList()
          await openHiddenCommandsModal(deps)
        }
      } catch (error) {
        console.error('Erro ao reativar comando oculto:', error)
      }
    })
  })
}
