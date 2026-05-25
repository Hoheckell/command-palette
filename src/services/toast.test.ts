import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showToast } from './toast'

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
  })

  it('does nothing when toast container is missing', () => {
    expect(() => showToast('oi')).not.toThrow()
  })

  it('renders and auto-removes toast', () => {
    document.body.innerHTML = '<div id="toast-container"></div>'

    showToast('salvo', 'success')

    const toast = document.querySelector('.toast-success') as HTMLDivElement
    expect(toast).toBeTruthy()
    expect(toast.textContent).toBe('salvo')

    vi.advanceTimersByTime(3000)
    expect(toast.classList.contains('toast-hide')).toBe(true)

    vi.advanceTimersByTime(300)
    expect(document.querySelector('.toast-success')).toBeNull()
  })
})
