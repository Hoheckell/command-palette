import type { SavedCommandsCache } from './saved-commands-cache'
import { tauriApi } from '../../services/tauri-api'

interface OpenSavedHelpsModalDeps {
  openSavedModal: (title: string, content: string) => void
  savedCommandsCache: SavedCommandsCache
  rerenderCurrentList: () => void
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function openSavedHelpsModal(deps: OpenSavedHelpsModalDeps) {
  const { openSavedModal, savedCommandsCache, rerenderCurrentList } = deps

  const helps = await tauriApi.getSavedHelps()

  if (helps.length === 0) {
    openSavedModal('Ajudas salvas', 'Nenhuma ajuda salva ainda.')
    return
  }

  openSavedModal(
    'Ajudas salvas',
    helps
      .map(([id, command, help]) => {
        return `
        <div class="history-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
            <span class="history-command">
                ${escapeHtml(command.replace(/[\d]/g, ''))}
            </span>
            <div style="display: flex; gap: 8px;">
              <button
                title="Executar"
                class="run-saved-command"
                data-command="${escapeHtml(command)}"
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
          </div>
          <div class="saved-help-content" style="width: 100%; max-height: 200px; overflow-y: auto; background: var(--bg-tertiary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.9em; white-space: pre-wrap;">
            ${escapeHtml(help)}
          </div>
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
        await openSavedHelpsModal(deps)
      } catch (error) {
        console.error('Erro ao deletar ajuda:', error)
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
