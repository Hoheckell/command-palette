import { tauriApi } from '../../services/tauri-api'
import type { CommandFlag } from '../../shared/types/command'

interface OpenCommandBuilderModalDeps {
  container: HTMLDivElement
  onRunCommand: (command: string) => Promise<void>
  onSaveCommand: (command: string) => Promise<void>
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cssEscapedId(raw: string) {
  return raw.replace(/[^-:\w]/g, '_')
}

function buildCommand(baseCommand: string, flags: CommandFlag[]) {
  const parts = [baseCommand.trim()]

  flags.forEach(flag => {
    const id = cssEscapedId(flag.flag)
    const checkbox = document.querySelector(`#builder-flag-${id}`) as HTMLInputElement | null

    if (!checkbox?.checked) return

    parts.push(flag.flag)

    if (flag.requires_value) {
      const valueInput = document.querySelector(`#builder-value-${id}`) as HTMLInputElement | null
      const value = valueInput?.value.trim() ?? ''

      if (value.length > 0) {
        parts.push(value)
      }
    }
  })

  return parts.join(' ').trim()
}

export function openCommandBuilderModal(deps: OpenCommandBuilderModalDeps) {
  const { container, onRunCommand, onSaveCommand } = deps

  const closeModal = () => {
    container.innerHTML = ''
    document.removeEventListener('keydown', onEsc)
  }

  const onEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  document.addEventListener('keydown', onEsc)

  container.innerHTML = `
    <div class="builder-overlay">
      <div class="builder-content">
        <div class="builder-top">
          <h2>Command Builder</h2>
          <button id="close-builder-modal">✕</button>
        </div>

        <div class="builder-controls">
          <input id="builder-command-input" placeholder="Digite comando base (ssh, git, docker, ffmpeg...)" />
          <button id="builder-load-flags">Carregar flags</button>
        </div>

        <div id="builder-status" class="builder-status">Informe um comando base e carregue as flags.</div>
        <div id="builder-flags" class="builder-flags"></div>

        <div class="builder-result-block">
          <label for="builder-command-output">Comando final</label>
          <textarea id="builder-command-output" rows="3" readonly></textarea>
        </div>

        <div class="builder-actions">
          <button id="builder-copy">Copiar</button>
          <button id="builder-run">Executar</button>
          <button id="builder-save">Salvar</button>
        </div>
      </div>
    </div>
  `

  const overlay = container.querySelector('.builder-overlay') as HTMLDivElement
  const closeButton = container.querySelector('#close-builder-modal') as HTMLButtonElement
  const commandInput = container.querySelector('#builder-command-input') as HTMLInputElement
  const loadButton = container.querySelector('#builder-load-flags') as HTMLButtonElement
  const status = container.querySelector('#builder-status') as HTMLDivElement
  const flagsContainer = container.querySelector('#builder-flags') as HTMLDivElement
  const output = container.querySelector('#builder-command-output') as HTMLTextAreaElement
  const copyButton = container.querySelector('#builder-copy') as HTMLButtonElement
  const runButton = container.querySelector('#builder-run') as HTMLButtonElement
  const saveButton = container.querySelector('#builder-save') as HTMLButtonElement

  let currentFlags: CommandFlag[] = []

  const updateOutput = () => {
    output.value = buildCommand(commandInput.value, currentFlags)
  }

  const bindFlagEvents = () => {
    const inputs = flagsContainer.querySelectorAll('input')

    inputs.forEach(input => {
      input.addEventListener('input', updateOutput)
      input.addEventListener('change', updateOutput)
    })
  }

  const renderFlags = (flags: CommandFlag[]) => {
    if (flags.length === 0) {
      flagsContainer.innerHTML = '<p class="builder-empty">Nenhuma flag identificada no help.</p>'
      updateOutput()
      return
    }

    flagsContainer.innerHTML = flags
      .map(flag => {
        const idFlag = `builder-flag-${flag.flag}`
        const idValue = `builder-value-${flag.flag}`

        const descHtml = flag.description ? escapeHtml(flag.description) : ''
        const exampleHtml = flag.example ? `<code class="builder-flag-example">${escapeHtml(flag.example)}</code>` : ''

        return `
          <label class="builder-flag-item">
            <input type="checkbox" id="${escapeHtml(idFlag)}" />
            <span class="builder-flag-name">${escapeHtml(flag.flag)}</span>
            ${descHtml ? `<span class="builder-flag-description" title="${descHtml}">${descHtml}</span>` : ''}
            ${exampleHtml}
            ${flag.requires_value ? `<input id="${escapeHtml(idValue)}" class="builder-flag-value" placeholder="valor" />` : ''}
          </label>
        `
      })
      .join('')

    bindFlagEvents()
    updateOutput()
  }

  loadButton.onclick = async () => {
    const baseCommand = commandInput.value.trim()

    if (baseCommand.length === 0) {
      status.innerText = 'Digite um comando base válido.'
      return
    }

    try {
      loadButton.disabled = true
      loadButton.innerText = 'Carregando...'
      status.innerText = `Buscando help de ${baseCommand}...`

      const data = await tauriApi.getCommandHelp(baseCommand)
      currentFlags = data.flags
      status.innerText = `Help carregado para ${data.command}. ${data.flags.length} flags encontradas.`
      renderFlags(data.flags)
    } catch (error) {
      currentFlags = []
      flagsContainer.innerHTML = ''
      status.innerText = `Falha ao carregar flags: ${String(error)}`
      updateOutput()
    } finally {
      loadButton.disabled = false
      loadButton.innerText = 'Carregar flags'
    }
  }

  copyButton.onclick = async () => {
    const value = output.value.trim()

    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      copyButton.innerText = 'Copiado'
      setTimeout(() => {
        copyButton.innerText = 'Copiar'
      }, 1200)
    } catch (error) {
      console.error(error)
      copyButton.innerText = 'Erro'
    }
  }

  runButton.onclick = async () => {
    const value = output.value.trim()

    if (!value) return

    await onRunCommand(value)
  }

  saveButton.onclick = async () => {
    const value = output.value.trim()

    if (!value) return

    await onSaveCommand(value)
    saveButton.innerText = 'Salvo'
    setTimeout(() => {
      saveButton.innerText = 'Salvar'
    }, 1200)
  }

  commandInput.addEventListener('input', () => {
    updateOutput()
  })

  closeButton.onclick = closeModal
  overlay.onclick = event => {
    if (event.target === overlay) {
      closeModal()
    }
  }
}
