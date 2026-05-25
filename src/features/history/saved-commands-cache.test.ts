import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SavedCommandsCache } from './saved-commands-cache'

const { getSavedCommands } = vi.hoisted(() => ({
  getSavedCommands: vi.fn()
}))

vi.mock('../../services/tauri-api', () => {
  return {
    tauriApi: {
      getSavedCommands
    }
  }
})

describe('saved-commands-cache', () => {
  beforeEach(() => {
    getSavedCommands.mockReset()
  })

  it('syncs command ids and keeps first id when duplicate appears', async () => {
    getSavedCommands.mockResolvedValue([
      [10, 'ls'],
      [11, 'ls'],
      [12, 'git status']
    ])

    const cache = new SavedCommandsCache()
    await cache.sync()

    expect(cache.getId('ls')).toBe(10)
    expect(cache.getId('git status')).toBe(12)
    expect(cache.has('pwd')).toBe(false)
  })
})
