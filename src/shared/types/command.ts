export type SavedCommandRow = [number, string]
export type SavedHistoryRow = [number, string]
export type SavedHelpRow = [number, string, string]

export interface CommandFlag {
  flag: string
  description: string
  requires_value: boolean
  example: string
}

export interface CommandHelpData {
  command: string
  help_text: string
  flags: CommandFlag[]
}
