import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openCommandBuilderModal } from './command-builder-modal'
import type { CommandHelpData } from '../../shared/types/command'

const { getCommandHelp } = vi.hoisted(() => ({
  getCommandHelp: vi.fn()
}))

vi.mock('../../services/tauri-api', () => {
  return {
    tauriApi: {
      getCommandHelp
    }
  }
})

describe('command-builder-modal', () => {
  let container: HTMLDivElement
  const onRunCommand = vi.fn().mockResolvedValue(undefined)
  const onSaveCommand = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'builder-modal'
    document.body.appendChild(container)
    getCommandHelp.mockReset()
    onRunCommand.mockClear()
    onSaveCommand.mockClear()
  })

  afterEach(() => {
    container.remove()
  })

  it('opens and renders the modal structure', () => {
    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    expect(container.querySelector('.builder-overlay')).toBeTruthy()
    expect(container.querySelector('#builder-command-input')).toBeTruthy()
    expect(container.querySelector('#builder-load-flags')).toBeTruthy()
    expect(container.querySelector('#builder-command-output')).toBeTruthy()
    expect(container.querySelector('#builder-copy')).toBeTruthy()
    expect(container.querySelector('#builder-run')).toBeTruthy()
    expect(container.querySelector('#builder-save')).toBeTruthy()
  })

  it('closes modal when close button is clicked', () => {
    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    const closeButton = container.querySelector('#close-builder-modal') as HTMLButtonElement
    closeButton.click()

    expect(container.innerHTML).toBe('')
  })

  it('closes modal with Escape key', () => {
    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(container.innerHTML).toBe('')
  })

  it('closes modal when clicking outside the content', () => {
    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    const overlay = container.querySelector('.builder-overlay') as HTMLDivElement
    overlay.click()

    expect(container.innerHTML).toBe('')
  })

  it('calls getCommandHelp on load flags click and renders flags', async () => {
    const mockData: CommandHelpData = {
      command: 'ssh',
      help_text: 'usage: ssh',
      flags: [
        { flag: '-p', description: 'Port to connect to', requires_value: true, example: '-p 22' },
        { flag: '-v', description: 'Verbose mode', requires_value: false, example: '-v' }
      ]
    }

    getCommandHelp.mockResolvedValue(mockData)

    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    const input = container.querySelector('#builder-command-input') as HTMLInputElement
    input.value = 'ssh'

    const loadButton = container.querySelector('#builder-load-flags') as HTMLButtonElement
    await loadButton.click()

    const flagItems = container.querySelectorAll('.builder-flag-item')
    expect(flagItems).toHaveLength(2)
    expect(flagItems[0].textContent).toContain('-p')
    expect(flagItems[1].textContent).toContain('-v')
  })

  it('updates command output when flag is toggled', async () => {
    const mockData: CommandHelpData = {
      command: 'ssh',
      help_text: 'usage: ssh',
      flags: [
        { flag: '-v', description: 'Verbose mode', requires_value: false, example: '-v' }
      ]
    }

    getCommandHelp.mockResolvedValue(mockData)

    openCommandBuilderModal({ container, onRunCommand, onSaveCommand })

    const input = container.querySelector('#builder-command-input') as HTMLInputElement
    input.value = 'ssh'

    const loadButton = container.querySelector('#builder-load-flags') as HTMLButtonElement
    await loadButton.click()

    const checkbox = container.querySelector('#builder-flag--v') as HTMLInputElement
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const output = container.querySelector('#builder-command-output') as HTMLTextAreaElement
    expect(output.value).toBe('ssh -v')
  })
})
