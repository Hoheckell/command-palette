import { tauriApi } from '../../services/tauri-api'

export class SavedCommandsCache {
  private commandIds = new Map<string, number>()

  async sync() {
    const savedCommands = await tauriApi.getSavedCommands()

    this.commandIds = new Map<string, number>()

    savedCommands.forEach(([id, command]) => {
      if (!this.commandIds.has(command)) {
        this.commandIds.set(command, id)
      }
    })
  }

  getId(command: string) {
    return this.commandIds.get(command)
  }

  has(command: string) {
    return this.commandIds.has(command)
  }
}
