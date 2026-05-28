
import { tauriApi } from "../../services/tauri-api"

export class HiddenCommandsCache {
  private hiddenCommands = new Set<string>()

  async sync() {
    const hiddenCommands = await tauriApi.getHiddenCommands()

    this.hiddenCommands = new Set<string>()

    hiddenCommands.forEach(command => {
      if (!this.hiddenCommands.has(command)) {
        this.hiddenCommands.add(command)
      }
    })
  }

  has(command: string) {
    return this.hiddenCommands.has(command)
  }
}