export interface FavoritesStore {
  isFavorite(command: string): boolean
  toggle(command: string): boolean
  sort(commands: string[]): string[]
  persist(): void
}

export function createFavoritesStore(storageKey: string): FavoritesStore {
  let favorites = loadFavorites(storageKey)

  return {
    isFavorite(command: string) {
      return favorites.has(command)
    },

    toggle(command: string) {
      if (favorites.has(command)) {
        favorites.delete(command)
        return false
      }

      favorites.add(command)
      return true
    },

    sort(commands: string[]) {
      const favoriteCommands: string[] = []
      const regularCommands: string[] = []

      commands.forEach(command => {
        if (favorites.has(command)) {
          favoriteCommands.push(command)
          return
        }

        regularCommands.push(command)
      })

      return [...favoriteCommands, ...regularCommands]
    },

    persist() {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]))
    }
  }
}

function loadFavorites(storageKey: string) {
  const raw = localStorage.getItem(storageKey)

  if (!raw) {
    return new Set<string>()
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return new Set<string>()
    }

    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set<string>()
  }
}
