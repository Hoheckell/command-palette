import { invoke } from '@tauri-apps/api/core'
import type { CommandHelpData, SavedCommandRow, SavedHistoryRow, SavedHelpRow } from '../shared/types/command'

export const tauriApi = {
  hasInternet() {
    return invoke<boolean>('has_internet')
  },

  hasXdotool() {
    return invoke<boolean>('has_xdotool')
  },

  detectPackageManager() {
    return invoke<string>('detect_package_manager')
  },

  installXdotool() {
    return invoke('install_xdotool')
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
  },

  getCommandHelp(command: string) {
    return invoke<CommandHelpData>('get_command_help', { command })
  },
  
  getHiddenCommands() {
    return invoke<string[]>('get_hidden_commands')
  },
  
  unhideCommand(command: string) {
    return invoke('unhide_command', { command })
  },
  
  hideCommand(command: string) {
    return invoke('hide_command', { command })
  },
  
  getSavedHelps() {
    return invoke<SavedHelpRow[]>('get_saved_helps')
  }
  
}
