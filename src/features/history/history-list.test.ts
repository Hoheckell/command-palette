import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFavoritesStore } from './favorites-store'
import { SavedCommandsCache } from './saved-commands-cache'
import { renderHistoryList } from './history-list'

describe('history-list', () => {
  let historyList: HTMLUListElement

  beforeEach(() => {
    document.body.innerHTML = '<ul id="history"></ul>'
    historyList = document.querySelector('#history') as HTMLUListElement
    localStorage.clear()
  })

  it('renders non-empty commands and applies favorite class', () => {
    const favoritesStore = createFavoritesStore('favorites-list-test')
    favoritesStore.toggle('git status')

    const cache = new SavedCommandsCache()
    const deps = {
      historyList,
      favoritesStore,
      savedCommandsCache: cache,
      onSaveCommand: vi.fn().mockResolvedValue(undefined),
      onDeleteCommand: vi.fn().mockResolvedValue(undefined),
      onRunCommand: vi.fn().mockResolvedValue(undefined),
      onShowCommandHelp: vi.fn().mockResolvedValue(undefined),
      onFavoriteAdded: vi.fn().mockResolvedValue(undefined),
      onAfterStateChange: vi.fn()
    }

    renderHistoryList(['', 'ls', 'git status'], deps)

    const rows = historyList.querySelectorAll('li')
    expect(rows).toHaveLength(2)
    const firstText = rows[0].querySelector('span') as HTMLSpanElement
    expect(firstText.innerText).toBe('git status')
    expect(rows[0].classList.contains('is-favorite')).toBe(true)
  })

  it('saves command when not cached and then rerenders callback', async () => {
    const favoritesStore = createFavoritesStore('favorites-list-test')
    const cache = new SavedCommandsCache()
    const onSaveCommand = vi.fn().mockResolvedValue(undefined)
    const onAfterStateChange = vi.fn()

    renderHistoryList(['npm test'], {
      historyList,
      favoritesStore,
      savedCommandsCache: cache,
      onSaveCommand,
      onDeleteCommand: vi.fn().mockResolvedValue(undefined),
      onRunCommand: vi.fn().mockResolvedValue(undefined),
      onShowCommandHelp: vi.fn().mockResolvedValue(undefined),
      onFavoriteAdded: vi.fn().mockResolvedValue(undefined),
      onAfterStateChange
    })

    const saveButton = historyList.querySelector('.save-button') as HTMLButtonElement
    await saveButton.onclick?.(new MouseEvent('click'))

    expect(onSaveCommand).toHaveBeenCalledWith('npm test')
    expect(onAfterStateChange).toHaveBeenCalledTimes(1)
  })

  it('favorites a command and persists state', async () => {
    const favoritesStore = createFavoritesStore('favorites-list-test')
    const cache = new SavedCommandsCache()
    const onFavoriteAdded = vi.fn().mockResolvedValue(undefined)
    const onAfterStateChange = vi.fn()

    renderHistoryList(['echo ok'], {
      historyList,
      favoritesStore,
      savedCommandsCache: cache,
      onSaveCommand: vi.fn().mockResolvedValue(undefined),
      onDeleteCommand: vi.fn().mockResolvedValue(undefined),
      onRunCommand: vi.fn().mockResolvedValue(undefined),
      onShowCommandHelp: vi.fn().mockResolvedValue(undefined),
      onFavoriteAdded,
      onAfterStateChange
    })

    const favoriteButton = historyList.querySelector('.favorite-button') as HTMLButtonElement
    await favoriteButton.onclick?.(new MouseEvent('click'))

    expect(onFavoriteAdded).toHaveBeenCalledWith('echo ok')
    expect(favoritesStore.isFavorite('echo ok')).toBe(true)
    expect(onAfterStateChange).toHaveBeenCalledTimes(1)
  })
})
