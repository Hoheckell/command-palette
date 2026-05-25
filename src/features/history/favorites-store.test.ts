import { beforeEach, describe, expect, it } from 'vitest'
import { createFavoritesStore } from './favorites-store'

describe('favorites-store', () => {
  const key = 'favorites-test-key'

  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty when storage is missing', () => {
    const store = createFavoritesStore(key)
    expect(store.isFavorite('ls')).toBe(false)
  })

  it('toggles and persists favorites', () => {
    const store = createFavoritesStore(key)

    expect(store.toggle('git status')).toBe(true)
    store.persist()

    const nextStore = createFavoritesStore(key)
    expect(nextStore.isFavorite('git status')).toBe(true)

    expect(nextStore.toggle('git status')).toBe(false)
  })

  it('keeps original relative order while favoriting first', () => {
    const store = createFavoritesStore(key)
    store.toggle('b')
    store.toggle('d')

    expect(store.sort(['a', 'b', 'c', 'd'])).toEqual(['b', 'd', 'a', 'c'])
  })

  it('ignores invalid JSON and non-array payloads', () => {
    localStorage.setItem(key, '{invalid')
    const invalidStore = createFavoritesStore(key)
    expect(invalidStore.isFavorite('x')).toBe(false)

    localStorage.setItem(key, JSON.stringify({ nope: true }))
    const objectStore = createFavoritesStore(key)
    expect(objectStore.isFavorite('x')).toBe(false)
  })
})
