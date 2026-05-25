import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showCommandHelp } from './command-help'

const { getTldr, saveCommand } = vi.hoisted(() => ({
  getTldr: vi.fn(),
  saveCommand: vi.fn()
}))

const { explainCommand } = vi.hoisted(() => ({
  explainCommand: vi.fn()
}))

vi.mock('../../services/tauri-api', () => {
  return {
    tauriApi: {
      getTldr,
      saveCommand
    }
  }
})

vi.mock('../../ai', () => {
  return {
    explainCommand
  }
})

describe('command-help', () => {
  let commandHelp: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = '<div id="command-help"></div>'
    commandHelp = document.querySelector('#command-help') as HTMLDivElement
    getTldr.mockReset()
    saveCommand.mockReset()
    explainCommand.mockReset()
  })

  it('renders TLDR content and saves command', async () => {
    getTldr.mockResolvedValue('<unsafe>&"\'')
    saveCommand.mockResolvedValue(undefined)

    await showCommandHelp(commandHelp, 'ls -la')

    expect(getTldr).toHaveBeenCalledWith('ls')
    expect(commandHelp.innerHTML).toContain('&lt;unsafe&gt;&amp;')

    const saveButton = commandHelp.querySelector('#save-command') as HTMLButtonElement
    await saveButton.onclick?.(new MouseEvent('click'))

    expect(saveCommand).toHaveBeenCalledWith('ls -la', '<unsafe>&"\'', 'manual')
    expect(saveButton.innerText).toBe('Salvo')
  })

  it('renders deep explanation and handles error state', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getTldr.mockResolvedValue('mock content')
    explainCommand.mockResolvedValueOnce('explicacao profunda')

    await showCommandHelp(commandHelp, 'git status')

    const deepButton = commandHelp.querySelector('#deep-explanation') as HTMLButtonElement
    await deepButton.onclick?.(new MouseEvent('click'))

    expect(explainCommand).toHaveBeenCalledWith('git status', 'mock content')
    expect(commandHelp.textContent).toContain('explicacao profunda')

    explainCommand.mockRejectedValueOnce(new Error('falha IA'))
    await deepButton.onclick?.(new MouseEvent('click'))
    expect(commandHelp.textContent).toContain('Erro ao gerar explicação.')

    consoleErrorSpy.mockRestore()
  })

  it('shows fallback when TLDR fails and closes modal', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getTldr.mockRejectedValue(new Error('offline'))

    await showCommandHelp(commandHelp, 'unknown')
    expect(commandHelp.textContent).toContain('Sem documentação TLDR.')

    const closeButton = commandHelp.querySelector('.close-help') as HTMLButtonElement
    closeButton.click()
    expect(commandHelp.innerHTML).toBe('')

    consoleWarnSpy.mockRestore()
  })

  it('closes with overlay click and Escape key', async () => {
    getTldr.mockResolvedValue('ok')

    await showCommandHelp(commandHelp, 'pwd')
    const overlay = commandHelp.querySelector('.help-overlay') as HTMLDivElement
    overlay.click()
    expect(commandHelp.innerHTML).toBe('')

    await showCommandHelp(commandHelp, 'pwd')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(commandHelp.innerHTML).toBe('')
  })
})
