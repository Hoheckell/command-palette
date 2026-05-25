import { beforeEach, describe, expect, it } from 'vitest'
import { openAppHelp } from './app-help'

describe('app-help', () => {
  let helpContainer: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = '<div id="app-help"></div>'
    helpContainer = document.querySelector('#app-help') as HTMLDivElement
  })

  it('opens with expected content', () => {
    openAppHelp(helpContainer)

    expect(helpContainer.querySelector('.help-overlay')).toBeTruthy()
    expect(helpContainer.textContent).toContain("Sobre o Hoheckell's Command Palette")
  })

  it('closes when close button is clicked', () => {
    openAppHelp(helpContainer)

    const closeButton = helpContainer.querySelector('#close-main-help') as HTMLButtonElement
    closeButton.click()

    expect(helpContainer.innerHTML).toBe('')
  })

  it('closes with overlay click and Escape key', () => {
    openAppHelp(helpContainer)

    const overlay = helpContainer.querySelector('.help-overlay') as HTMLDivElement
    overlay.click()
    expect(helpContainer.innerHTML).toBe('')

    openAppHelp(helpContainer)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(helpContainer.innerHTML).toBe('')
  })
})
