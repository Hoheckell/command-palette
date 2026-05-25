export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const container = document.querySelector('#toast-container')
  if (!container) return

  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = message
  container.appendChild(el)

  setTimeout(() => {
    el.classList.add('toast-hide')
    setTimeout(() => el.remove(), 300)
  }, 3000)
}
