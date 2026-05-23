import { describe, expect, it, vi } from 'vitest'
import { tauriApi } from './tauri-api'

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn()
}))

vi.mock('@tauri-apps/api/core', () => {
  return {
    invoke
  }
})

describe('tauri-api', () => {
  it('routes methods to invoke with expected command names', async () => {
    invoke.mockResolvedValue(undefined)

    await tauriApi.hasTldr()
    await tauriApi.installTldr()
    await tauriApi.getHistory()
    await tauriApi.saveHistory(['ls'])
    await tauriApi.saveCommand('ls', 'help', 'history')
    await tauriApi.deleteSavedCommand(1)
    await tauriApi.runCommand('ls')
    await tauriApi.saveTerminalWindow()
    await tauriApi.disconnectTerminal()
    await tauriApi.getSavedCommands()
    await tauriApi.getSavedHistory()
    await tauriApi.getTldr('ls')

    expect(invoke).toHaveBeenCalledWith('has_tldr')
    expect(invoke).toHaveBeenCalledWith('install_tldr')
    expect(invoke).toHaveBeenCalledWith('get_history')
    expect(invoke).toHaveBeenCalledWith('save_history', { commands: ['ls'] })
    expect(invoke).toHaveBeenCalledWith('save_command', { command: 'ls', help: 'help', source: 'history' })
    expect(invoke).toHaveBeenCalledWith('delete_saved_command', { id: 1 })
    expect(invoke).toHaveBeenCalledWith('run_command', { command: 'ls' })
    expect(invoke).toHaveBeenCalledWith('save_terminal_window')
    expect(invoke).toHaveBeenCalledWith('disconnect_terminal')
    expect(invoke).toHaveBeenCalledWith('get_saved_commands')
    expect(invoke).toHaveBeenCalledWith('get_saved_history')
    expect(invoke).toHaveBeenCalledWith('get_tldr', { command: 'ls' })
  })
})
