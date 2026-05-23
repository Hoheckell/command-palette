import { tauriApi } from '../../services/tauri-api'

export async function showCommandHelp(commandHelp: HTMLDivElement, cmd: string) {
  const baseCommand = cmd.split(' ')[0]

  try {
    const content = await tauriApi.getTldr(baseCommand)

    commandHelp.innerHTML = `
    <div class="help-box">

      <div class="help-top">

        <div class="help-header">
          ${baseCommand}
        </div>

        <div class="help-actions">

          <button id="save-command">
            Salvar
          </button>

          <button class="close-help">
            ✕
          </button>

        </div>

      </div>

      <pre>${content}</pre>

    </div>
  `

    const closeButton = commandHelp.querySelector('.close-help') as HTMLButtonElement | null

    if (closeButton != null) {
      closeButton.onclick = () => {
        commandHelp.innerHTML = ''
      }
    }

    const saveButton = commandHelp.querySelector('#save-command') as HTMLButtonElement | null

    if (saveButton) {
      saveButton.onclick = async () => {
        try {
          await tauriApi.saveCommand(cmd, content, 'manual')

          saveButton.innerText = 'Salvo'
        } catch (err) {
          console.error(err)
          saveButton.innerText = 'Erro'
        }
      }
    }
  } catch {
    commandHelp.innerHTML = `
      <div class="help-box">

        <div class="help-top">

          <div class="help-header">
            ${baseCommand}
          </div>

          <button class="close-help">
            ✕
          </button>

        </div>

        Sem documentação TLDR.

      </div>
    `

    const closeButton = commandHelp.querySelector('.close-help') as HTMLButtonElement | null

    if (closeButton) {
      closeButton.onclick = () => {
        commandHelp.innerHTML = ''
      }
    }
  }
}
