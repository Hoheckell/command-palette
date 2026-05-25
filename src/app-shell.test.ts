import { describe, expect, it } from 'vitest'
import { appShellHtml } from './app-shell'

describe('app-shell', () => {
  it('contains required shell sections and action buttons', () => {
    document.body.innerHTML = `<div id="root">${appShellHtml}</div>`

    expect(document.querySelector('.layout')).toBeTruthy()
    expect(document.querySelector('.toolbar')).toBeTruthy()
    expect(document.querySelector('.search-section')).toBeTruthy()
    expect(document.querySelector('#history')).toBeTruthy()
    expect(document.querySelector('#toast-container')).toBeTruthy()
    expect(document.querySelector('#app-help')).toBeTruthy()
    expect(document.querySelector('#saved-modal')).toBeTruthy()
    expect(document.querySelector('#builder-modal')).toBeTruthy()
    expect(document.querySelector('#search-tldr-button')).toBeTruthy()
  })
})
