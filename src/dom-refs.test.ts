import { beforeEach, describe, expect, it } from 'vitest'
import { appShellHtml } from './app-shell'
import { getAppDomRefs } from './dom-refs'

describe('dom-refs', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="app">${appShellHtml}</div>`
  })

  it('returns all expected references', () => {
    const refs = getAppDomRefs()

    expect(refs.historyList.id).toBe('history')
    expect(refs.searchInput.id).toBe('search')
    expect(refs.themeToggle.id).toBe('theme-toggle')
    expect(refs.saveHistoryButton.id).toBe('save-history')
    expect(refs.viewSavedCommandsButton.id).toBe('view-saved-commands')
    expect(refs.viewSavedHistoryButton.id).toBe('view-saved-history')
    expect(refs.viewSavedHelpsButton.id).toBe('view-saved-helps')
    expect(refs.openCommandBuilderButton.id).toBe('open-command-builder')
    expect(refs.openHelpButton.id).toBe('open-help')
    expect(refs.commandHelp.id).toBe('command-help')
    expect(refs.builderModal.id).toBe('builder-modal')
    expect(refs.tldrStatus.id).toBe('tldr-status')
    expect(refs.aiStatus.id).toBe('ai-status')
    expect(refs.terminalStatus.id).toBe('terminal-status')
    expect(refs.captureButton.id).toBe('capture-terminal')
    expect(refs.disconnectButton.id).toBe('disconnect-terminal')
    expect(refs.searchTldrButton.id).toBe('search-tldr-button')
    expect(refs.systemDetect.id).toBe('system-detect')
  })
})
