import type { SavedCommandsCache } from './saved-commands-cache'
import { tauriApi } from '../../services/tauri-api'

interface OpenSavedHistoryModalDeps {
  openSavedModal: (title: string, content: string) => void
  savedCommandsCache: SavedCommandsCache
  rerenderCurrentList: () => void
}

export async function openSavedHistoryModal(deps: OpenSavedHistoryModalDeps) {
  const { openSavedModal, savedCommandsCache, rerenderCurrentList } = deps

  const commands = await tauriApi.getSavedHistory()

  if (commands.length === 0) {
    openSavedModal('Histórico salvo', 'Nenhum histórico salvo ainda.')
    return
  }

  openSavedModal(
    'Histórico salvo',
    commands
      .map(([id, command]) => {
        return `

      <div class="history-item">

        <span class="history-command">${command}</span>

        <button class="run-saved-command" data-command="${command}">
          ⏻
        </button>

        <button class="delete-saved-command" data-id="${id}">
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
        await openSavedHistoryModal(deps)
      } catch (error) {
        console.error('Erro ao deletar histórico salvo:', error)
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
        console.error('Erro ao executar comando salvo do histórico:', error)
      }
    })
  })
}
