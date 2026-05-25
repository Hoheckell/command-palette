import { beforeEach, describe, expect, it } from 'vitest'
import { openSavedModal } from './saved-modal'

describe('saved-modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="saved-modal"></div>'
  })

  it('renders title and content', () => {
    openSavedModal('Comandos', '<p>conteudo</p>')

    const modal = document.querySelector('#saved-modal') as HTMLDivElement
    expect(modal.textContent).toContain('Comandos')
    expect(modal.innerHTML).toContain('<p>conteudo</p>')
  })

  it('closes when clicking close button', () => {
    openSavedModal('Comandos', '<p>conteudo</p>')

    const closeButton = document.querySelector('#close-saved-modal') as HTMLButtonElement
    closeButton.click()

    const modal = document.querySelector('#saved-modal') as HTMLDivElement
    expect(modal.innerHTML).toBe('')
  })
})
