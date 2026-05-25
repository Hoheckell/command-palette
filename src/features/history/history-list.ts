import type { FavoritesStore } from './favorites-store'
import type { SavedCommandsCache } from './saved-commands-cache'

interface RenderHistoryListDeps {
  historyList: HTMLUListElement
  favoritesStore: FavoritesStore
  savedCommandsCache: SavedCommandsCache
  onSaveCommand: (command: string) => Promise<void>
  onDeleteCommand: (id: number) => Promise<void>
  onRunCommand: (command: string) => Promise<void>
  onShowCommandHelp: (command: string) => Promise<void>
  onFavoriteAdded: (command: string) => Promise<void>
  onAfterStateChange: () => void
}

export function renderHistoryList(commands: string[], deps: RenderHistoryListDeps) {
  const {
    historyList,
    favoritesStore,
    savedCommandsCache,
    onSaveCommand,
    onDeleteCommand,
    onRunCommand,
    onShowCommandHelp,
    onFavoriteAdded,
    onAfterStateChange
  } = deps

  historyList.innerHTML = ''

  favoritesStore.sort(commands).forEach(command => {
    if (!command.trim()) return

    const li = document.createElement('li')
    const isFavorite = favoritesStore.isFavorite(command)

    if (isFavorite) {
      li.classList.add('is-favorite')
    }

    const row = document.createElement('div')
    row.className = 'history-row'

    const text = document.createElement('span')
    text.className = 'history-command-text'
    text.innerText = command

    const helpButton = document.createElement('button')

helpButton.className =
  'help-button'

helpButton.innerText = '📖'

helpButton.title =
  'Ver ajuda do comando'

helpButton.onclick = async event => {

  event.stopPropagation()

  if (
    li.classList.contains(
      'is-loading-help'
    )
  ) return

  li.classList.add(
    'is-loading-help'
  )

  const loadingBadge =
    document.createElement('span')

  loadingBadge.className =
    'help-loading-badge'

  loadingBadge.innerHTML = `
      <span
        class="help-spinner"
        aria-hidden="true"
      ></span>

      Carregando ajuda...
  `

  row.appendChild(loadingBadge)

  try {

    await onShowCommandHelp(
      command
    )

  } finally {

    loadingBadge.remove()

    li.classList.remove(
      'is-loading-help'
    )
  }
}
const runButton =
  document.createElement('button')

runButton.className =
  'run-button'

runButton.innerText = '▶'

runButton.title =
  'Executar comando'

runButton.onclick =
  async event => {

    event.stopPropagation()

    await onRunCommand(command)
  }

    const favoriteButton = document.createElement('button')
    favoriteButton.className = 'favorite-button'
    favoriteButton.innerText = isFavorite ? '★' : '☆'
    favoriteButton.title = isFavorite ? 'Desfavoritar comando' : 'Favoritar comando'

    favoriteButton.onclick = async event => {
      event.stopPropagation()

      try {
        const isCurrentlyFavorite = favoritesStore.isFavorite(command)

        if (isCurrentlyFavorite) {
          favoritesStore.toggle(command)
        } else {
          if (!savedCommandsCache.has(command)) {
            await onFavoriteAdded(command)
          }

          favoritesStore.toggle(command)
        }

        favoritesStore.persist()
        onAfterStateChange()
      } catch (err) {
        console.error(err)
      }
    }

    const saveButton = document.createElement('button')
    saveButton.className = 'save-button'

    const savedCommandId = savedCommandsCache.getId(command)
    saveButton.innerText = savedCommandId == null ? '💾' : '🗑️'
    saveButton.title = savedCommandId == null ? 'Salvar comando' : 'Remover comando salvo'

    saveButton.onclick = async event => {
      event.stopPropagation()

      try {
        if (savedCommandId == null) {
          await onSaveCommand(command)
        } else {
          await onDeleteCommand(savedCommandId)
        }

        onAfterStateChange()
      } catch (err) {
        console.error(err)
        saveButton.innerText = '⚠'
      }
    }

    row.appendChild(text)

const actions =
  document.createElement('div')

actions.className =
  'history-actions'

actions.appendChild(helpButton)

actions.appendChild(runButton)

actions.appendChild(favoriteButton)

actions.appendChild(saveButton)

row.appendChild(actions)
    li.appendChild(row)


    historyList.appendChild(li)
  })
}
