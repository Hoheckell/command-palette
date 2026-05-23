import type { SavedCommandsCache } from './saved-commands-cache'
import { tauriApi } from '../../services/tauri-api'

interface OpenSavedCommandsModalDeps {
  openSavedModal: (title: string, content: string) => void
  savedCommandsCache: SavedCommandsCache
  rerenderCurrentList: () => void
}

export async function openSavedCommandsModal(deps: OpenSavedCommandsModalDeps) {
  const { openSavedModal, savedCommandsCache, rerenderCurrentList } = deps

  const commands = await tauriApi.getSavedCommands()

  if (commands.length === 0) {
    openSavedModal('Comandos salvos', 'Nenhum comando salvo ainda.')
    return
  }

  openSavedModal(
    'Comandos salvos',
    commands
      .map(([id, command]) => {
        return `
        <div class="history-item">
          <span class="history-command">
              ${command.replace(/[\d]/g, '')}
            </span>
          <button
            title="Executar"
            class="run-saved-command"
            data-command="${command}"
          >
            ⏻
          </button>

          <button
            title="Apagar"
            class="delete-saved-command"
            data-id="${id}"
          >
            🗑️
          </button>

        </div>
      `
      })
      .join('')
  )

  const deleteButtons = document.querySelectorAll('.delete-saved-command')

  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const id = Number((button as HTMLButtonElement).dataset.id)

        await tauriApi.deleteSavedCommand(id)

        await savedCommandsCache.sync()
        rerenderCurrentList()
        await openSavedCommandsModal(deps)
      } catch (error) {
        console.error('Erro ao deletar comando:', error)
      }
    })
  })

  const runButtons = document.querySelectorAll('.run-saved-command')

  runButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const command = (button as HTMLButtonElement).dataset.command

        await tauriApi.runCommand(command ?? '')
      } catch (error) {
        console.error('Erro ao executar comando:', error)
      }
    })
  })
}
