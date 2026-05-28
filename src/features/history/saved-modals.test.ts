import { beforeEach, describe, expect, it, vi } from 'vitest'
import { openSavedCommandsModal } from './saved-commands-modal'
import { openSavedHistoryModal } from './saved-history-modal'
import { openHiddenCommandsModal } from './hidden-commands-modal'

const { getSavedCommands, getSavedHistory, deleteSavedCommand, runCommand, getHiddenCommands, unhideCommand } = vi.hoisted(() => ({
  getSavedCommands: vi.fn(),
  getSavedHistory: vi.fn(),
  deleteSavedCommand: vi.fn(),
  runCommand: vi.fn(),
  getHiddenCommands: vi.fn(),
  unhideCommand: vi.fn()
}))

vi.mock('../../services/tauri-api', () => {
  return {
    tauriApi: {
      getSavedCommands,
      getSavedHistory,
      deleteSavedCommand,
      runCommand,
      getHiddenCommands,
      unhideCommand
    }
  }
})

describe('saved modals', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modal"></div>'
    getSavedCommands.mockReset()
    getSavedHistory.mockReset()
    deleteSavedCommand.mockReset()
    runCommand.mockReset()
    getHiddenCommands.mockReset()
    unhideCommand.mockReset()
  })

  it('shows empty state for saved commands', async () => {
    getSavedCommands.mockResolvedValue([])
    const openSavedModal = vi.fn()

    await openSavedCommandsModal({
      openSavedModal,
      savedCommandsCache: { sync: vi.fn() } as never,
      rerenderCurrentList: vi.fn()
    })

    expect(openSavedModal).toHaveBeenCalledWith('Comandos salvos', 'Nenhum comando salvo ainda.')
  })

  it('runs and deletes command from saved commands modal', async () => {
    getSavedCommands.mockResolvedValueOnce([[1, 'npm test']]).mockResolvedValueOnce([])
    deleteSavedCommand.mockResolvedValue(undefined)
    runCommand.mockResolvedValue(undefined)

    const sync = vi.fn().mockResolvedValue(undefined)
    const rerenderCurrentList = vi.fn()
    const openSavedModal = vi.fn((_: string, content: string) => {
      const modal = document.querySelector('#modal') as HTMLDivElement
      modal.innerHTML = content
    })

    await openSavedCommandsModal({
      openSavedModal,
      savedCommandsCache: { sync } as never,
      rerenderCurrentList
    })

    const runBtn = document.querySelector('.run-saved-command') as HTMLButtonElement
    runBtn.click()
    await Promise.resolve()
    expect(runCommand).toHaveBeenCalledWith('npm test')

    const deleteBtn = document.querySelector('.delete-saved-command') as HTMLButtonElement
    deleteBtn.click()
    await Promise.resolve()
    await Promise.resolve()
    expect(deleteSavedCommand).toHaveBeenCalledWith(1)
    expect(sync).toHaveBeenCalled()
    expect(rerenderCurrentList).toHaveBeenCalled()
  })

  it('shows empty state for saved history', async () => {
    getSavedHistory.mockResolvedValue([])
    const openSavedModal = vi.fn()

    await openSavedHistoryModal({
      openSavedModal,
      savedCommandsCache: { sync: vi.fn() } as never,
      rerenderCurrentList: vi.fn()
    })

    expect(openSavedModal).toHaveBeenCalledWith('Histórico salvo', 'Nenhum histórico salvo ainda.')
  })

  it('shows empty state for hidden commands', async () => {
    getHiddenCommands.mockResolvedValue([])
    const openSavedModal = vi.fn()

    await openHiddenCommandsModal({
      openSavedModal,
      hiddenCommandsCache: { sync: vi.fn() } as any,
      rerenderCurrentList: vi.fn()
    })

    expect(openSavedModal).toHaveBeenCalledWith('Comandos ocultos', 'Nenhum comando oculto ainda.')
  })

  it('unhides a command from hidden commands modal', async () => {
    getHiddenCommands.mockResolvedValueOnce(['echo hidden']).mockResolvedValueOnce([])
    unhideCommand.mockResolvedValue(undefined)

    const sync = vi.fn().mockResolvedValue(undefined)
    const rerenderCurrentList = vi.fn()
    const openSavedModal = vi.fn((_: string, content: string) => {
      const modal = document.querySelector('#modal') as HTMLDivElement
      modal.innerHTML = content
    })

    await openHiddenCommandsModal({
      openSavedModal,
      hiddenCommandsCache: { sync } as any,
      rerenderCurrentList
    })

    const unhideBtn = document.querySelector('.unhide-command') as HTMLButtonElement
    unhideBtn.click()
    await Promise.resolve()
    await Promise.resolve()

    expect(unhideCommand).toHaveBeenCalledWith('echo hidden')
    expect(sync).toHaveBeenCalled()
    expect(rerenderCurrentList).toHaveBeenCalled()
  })
})
