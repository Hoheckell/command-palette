import { explainCommand } from '../../ai'
import { tauriApi } from '../../services/tauri-api'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function showCommandHelp(commandHelp: HTMLDivElement, cmd: string) {
  const baseCommand = cmd.split(' ')[0]

  const closeModal = () => {
    commandHelp.innerHTML = ''
    document.removeEventListener('keydown', handleEscape)
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  document.addEventListener('keydown', handleEscape)

  commandHelp.innerHTML = `
    <div class="help-overlay">
      <div class="help-modal help-modal-command">
        <div class="help-modal-top">
          <h2>Ajuda de comando</h2>
          <button class="close-help">✕</button>
        </div>
        <div class="help-content help-content-loading">
          <div class="help-spinner" aria-hidden="true"></div>
          <p>Buscando TLDR de <strong>${escapeHtml(baseCommand)}</strong>...</p>
        </div>
      </div>
    </div>
  `

  const loadingCloseButton = commandHelp.querySelector('.close-help') as HTMLButtonElement | null
  const loadingOverlay = commandHelp.querySelector('.help-overlay') as HTMLDivElement | null

  if (loadingCloseButton != null) {
    loadingCloseButton.onclick = closeModal
  }

  if (loadingOverlay != null) {
    loadingOverlay.onclick = event => {
      if (event.target === loadingOverlay) {
        closeModal()
      }
    }
  }

  try {
    const content = await tauriApi.getTldr(baseCommand)

    commandHelp.innerHTML = `
    <div class="help-overlay">
      <div class="help-modal help-modal-command">
        <div class="help-modal-top">
          <h2>${escapeHtml(baseCommand)}</h2>
          <div class="help-actions">
            <button id="save-command">Salvar</button>
            <button class="close-help">✕</button>
          </div>
        </div>
        <div class="help-content">
          <pre>${escapeHtml(content)}</pre>
          <button id="deep-explanation">
            Explicação aprofundada
          </button>
          <div id="deep-explanation-content"></div>
        </div>
      </div>
    </div>
  `

    const closeButton = commandHelp.querySelector('.close-help') as HTMLButtonElement | null
    const overlay = commandHelp.querySelector('.help-overlay') as HTMLDivElement | null

    if (closeButton != null) {
      closeButton.onclick = closeModal
    }

    if (overlay != null) {
      overlay.onclick = event => {
        if (event.target === overlay) {
          closeModal()
        }
      }
    }

    let contentToSave = content

    const saveButton = commandHelp.querySelector('#save-command') as HTMLButtonElement | null

    if (saveButton) {
      saveButton.onclick = async () => {
        try {
          await tauriApi.saveCommand(cmd, contentToSave, 'manual')

          saveButton.innerText = 'Salvo'
        } catch (err) {
          console.error(err)
          saveButton.innerText = 'Erro'
        }
      }
    }
    const deepButton = commandHelp.querySelector('#deep-explanation') as HTMLButtonElement | null
    
    if (deepButton) {

      deepButton.onclick = async () => {

    const container =
      commandHelp.querySelector(
        '#deep-explanation-content'
      ) as HTMLDivElement | null

    if (!container) return;

    container.innerHTML = `
      Gerando explicação...
    `

    try {

      const explanation =
        await explainCommand(
          cmd,
          content
        )

      contentToSave = content + '\n\nExplicação Aprofundada:\n' + explanation

      container.innerHTML = `
        <div class="deep-help">

          <pre>
${explanation}
          </pre>

        </div>
      `

    } catch (err) {

      console.error(err)

      container.innerHTML = `
        Erro ao gerar explicação.
      `
    }
  }
}
  } catch (error) {
    console.warn('Falha ao carregar TLDR para comando:', baseCommand, error)
    commandHelp.innerHTML = `
      <div class="help-overlay">
        <div class="help-modal help-modal-command">
          <div class="help-modal-top">
            <h2>${escapeHtml(baseCommand)}</h2>
            <button class="close-help">✕</button>
          </div>
          <div class="help-content">
            Sem documentação TLDR.
          </div>
        </div>
      </div>
    `

    const closeButton = commandHelp.querySelector('.close-help') as HTMLButtonElement | null
    const overlay = commandHelp.querySelector('.help-overlay') as HTMLDivElement | null

    if (closeButton) {
      closeButton.onclick = closeModal
    }

    if (overlay != null) {
      overlay.onclick = event => {
        if (event.target === overlay) {
          closeModal()
        }
      }
    }
  }
}
