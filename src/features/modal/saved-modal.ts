export function openSavedModal(title: string, content: string) {
  const modal = document.querySelector('#saved-modal') as HTMLDivElement

  modal.innerHTML = `

    <div class="saved-overlay">

      <div class="saved-content">

        <div class="saved-top">

          <h2>${title}</h2>

          <button id="close-saved-modal">
            ✕
          </button>

        </div>

        ${content}

      </div>

    </div>
  `

  const closeButton = document.querySelector('#close-saved-modal') as HTMLButtonElement | null

  if (closeButton) {
    closeButton.onclick = () => {
      modal.innerHTML = ''
    }
  }
}
