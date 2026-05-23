import { invoke } from '@tauri-apps/api/core'
import type { SavedCommandRow, SavedHistoryRow } from '../shared/types/command'

export const tauriApi = {
  hasTldr() {
    return invoke<boolean>('has_tldr')
  },

  installTldr() {
    return invoke('install_tldr')
  },

  getHistory() {
    return invoke<string[]>('get_history')
  },

  saveHistory(commands: string[]) {
    return invoke('save_history', { commands })
  },

  saveCommand(command: string, help = '', source = 'history') {
    return invoke('save_command', { command, help, source })
  },

  deleteSavedCommand(id: number) {
    return invoke('delete_saved_command', { id })
  },

  runCommand(command: string) {
    return invoke('run_command', { command })
  },

  saveTerminalWindow() {
    return invoke<string>('save_terminal_window')
  },

  disconnectTerminal() {
    return invoke('disconnect_terminal')
  },

  getSavedCommands() {
    return invoke<SavedCommandRow[]>('get_saved_commands')
  },

  getSavedHistory() {
    return invoke<SavedHistoryRow[]>('get_saved_history')
  },

  getTldr(command: string) {
    return invoke<string>('get_tldr', { command })
  }
}
