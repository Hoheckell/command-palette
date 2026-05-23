import './style.css'
import { invoke } from '@tauri-apps/api/core'
import Fuse from 'fuse.js'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="layout">

  <header class="topbar">

    <h1>
      Hoheckell's Command Palette
    </h1>

  </header>

  <section class="toolbar">

    <button
      id="open-help"
      title="Abrir ajuda da aplicação"
    >
      ❔
    </button>

    <button
      id="capture-terminal"
      title="Conectar um terminal Linux"
    >
      ⛓
    </button>

    <button
      id="disconnect-terminal"
      title="Desconectar terminal atual"
    >
      ⛔
    </button>

    <button
      id="save-history"
      title="Salvar histórico completo"
    >
      💾
    </button>
    <button
  id="view-saved-history"
  title="Ver histórico salvo"
>
  📚
</button>

<button
  id="view-saved-commands"
  title="Ver comandos salvos"
>
  ⌘
</button>

<button
  id="view-saved-helps"
  title="Ver helps salvos"
>
  📖
</button>
    <label class="theme-switch">

  <input
    type="checkbox"
    id="theme-toggle"
  />

  <span>
    🌙
  </span>

</label>

  </section>

  <div id="tldr-status"></div>

  <section class="search-section">

    <input
      id="search"
      placeholder="Buscar comandos..."
    />

  </section>

  <div id="command-help"></div>

  <section class="history-section">

    <ul id="history"></ul>

  </section>

  <div id="app-help"></div>
  <div id="saved-modal"></div>

</div>
`
async function checkTldr() {
  console.log('Carregando TLDR')
  const installed =
    await invoke<boolean>('has_tldr')

  if (installed) {

    tldrStatus.innerHTML = `
      <div class="tldr-row">

        <span class="dot green"></span>

        <span>
          TLDR instalado
        </span>

      </div>
    `

    return
  }

  tldrStatus.innerHTML = `
    <div class="tldr-row">

      <span class="dot red"></span>

      <span>
        TLDR não instalado
      </span>

      <button id="install-tldr">
        Instalar
      </button>

    </div>
  `

  const installButton = document.querySelector('#install-tldr') as HTMLButtonElement

  installButton.onclick = async () => {

    installButton.innerText =
      'Instalando...'

    installButton.disabled = true

    try {

      await invoke('install_tldr')

      await checkTldr()

    } catch (err) {

      console.error(err)

      installButton.innerText =
        'Erro'

      alert(String(err))
    }
  }
}

const viewSavedHistoryButton = document.querySelector('#view-saved-history') as HTMLButtonElement
const viewSavedCommandsButton = document.querySelector('#view-saved-commands') as HTMLButtonElement
const viewSavedHelpsButton = document.querySelector('#view-saved-helps') as HTMLButtonElement
const helpContainer = document.querySelector('#app-help') as HTMLDivElement
const savedModal = document.querySelector('#saved-modal') as HTMLDivElement
const openHelpButton = document.querySelector('#open-help') as HTMLButtonElement
const commandHelp = document.querySelector('#command-help') as HTMLDivElement
const tldrStatus = document.querySelector('#tldr-status') as HTMLDivElement
const disconnectButton = document.querySelector('#disconnect-terminal') as HTMLButtonElement
const captureButton = document.querySelector('#capture-terminal') as HTMLButtonElement
const historyList = document.querySelector('#history') as HTMLUListElement
const searchInput = document.querySelector('#search') as HTMLInputElement
const saveHistoryButton = document.querySelector('#save-history') as HTMLButtonElement
const themeToggle = document.querySelector('#theme-toggle') as HTMLInputElement
const savedTheme = localStorage.getItem('theme')

if (savedTheme === 'light') {

  document.body.classList.add('light-theme')

  themeToggle.checked = true
}

themeToggle.onchange = () => {

  if (themeToggle.checked) {

    document.body.classList.add('light-theme')

    localStorage.setItem('theme', 'light')

  } else {

    document.body.classList.remove('light-theme')

    localStorage.setItem('theme', 'dark')
  }
}


let allCommands: string[] = []

let fuse: Fuse<string>


function render(commands: string[]) {
  historyList.innerHTML = ''

  commands.forEach(cmd => {
    if (!cmd.trim()) return

    const li = document.createElement('li')

    const row = document.createElement('div')
    row.className = 'history-row'
    const text = document.createElement('span')
    text.innerText = cmd
    const saveButton = document.createElement('button')


    saveButton.innerText = '💾'

    saveButton.title = 'Salvar comando'

    saveButton.onclick = async (e) => {

      e.stopPropagation()

      try {

        await invoke('save_command', {
          command: cmd,
          help: '',
          source: 'history'
        })

        saveButton.innerText = '✔'

      } catch (err) {

        console.error(err)

        saveButton.innerText = '⚠'
      }
    }
 
    row.appendChild(text) 
    row.appendChild(saveButton)

    li.appendChild(row)

    li.onclick = async () => {

      await showHelp(cmd)
    }

    li.ondblclick = async () => {

      await invoke('run_command', {
        command: cmd
      })
    }


    historyList.appendChild(li)
  })
}

interface Command {
  id: number;
  command: string;
  base_command?: string;
  help?: string;
  favorite: boolean;
  source: string
}   
async function loadHistory() {
  const commands = await invoke<string[]>('get_history')

  const uniqueCommands = [...new Set(commands.reverse())]

  allCommands = uniqueCommands

  fuse = new Fuse(allCommands, {
    threshold: 0.4
  })

  render(allCommands)
}

saveHistoryButton.onclick = async () => {

  try {

    await invoke('save_history', {
      commands: allCommands
    })

    saveHistoryButton.innerText =
      'Histórico salvo'

  } catch (err) {

    console.error(err)

    saveHistoryButton.innerText =
      'Erro'
  }
}

searchInput.addEventListener('input', () => {
  const value = searchInput.value.trim()

  if (!value) {
    render(allCommands)
    return
  }

  const results = fuse.search(value)

  render(results.map(r => r.item))
})

captureButton.onclick = async () => {

  captureButton.innerText =
    'Clique no terminal...'

  setTimeout(async () => {

    try {

      const id = await invoke<string>(
        'save_terminal_window'
      )

      captureButton.innerText =
        `Terminal conectado (${id})`

    } catch (err) {

      console.error(err)

      captureButton.innerText =
        'Erro ao conectar'
    }

  }, 3000)
}

disconnectButton.onclick = async () => {

  try {

    await invoke('disconnect_terminal')

    captureButton.innerText =
      'Capturar terminal'

  } catch (err) {

    console.error(err)
  }
}

async function showHelp(cmd: string) {

  const baseCommand =
    cmd.split(' ')[0]

  try {

    const content =
      await invoke<string>(
        'get_tldr',
        {
          command: baseCommand
        }
      )

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

          await invoke('save_command', {
            command: cmd,
            help: content,
            source: 'manual'
          })

          saveButton.innerText =
            'Salvo'

        } catch (err) {

          console.error(err)

          saveButton.innerText =
            'Erro'
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

openHelpButton.onclick = () => {

  helpContainer.innerHTML = `

    <div class="help-overlay">

      <div class="help-modal">

        <div class="help-modal-top">

          <h2>
            Sobre o Command Palette
          </h2>

          <button id="close-main-help">
            ✕
          </button>

        </div>

        <div class="help-content">

          <h3>
            O que é esta aplicação?
          </h3>

          <p>
            Esta aplicação transforma seu histórico de terminal em uma biblioteca pesquisável de comandos.
          </p>

          <p>
            Ela permite pesquisar, estudar, salvar e executar comandos rapidamente.
          </p>

          <hr />

          <h3>
            O que é TLDR?
          </h3>

          <p>
            TLDR é uma coleção comunitária de exemplos simples para comandos Linux.
          </p>

          <p>
            Diferente do comando man, o TLDR mostra exemplos rápidos e práticos.
          </p>

          <p>
            Exemplo:
          </p>

          <pre>
ls -la
find . -name "*.txt"
docker logs -f api
          </pre>

          <hr />

          <h3>
            Por que instalar TLDR?
          </h3>

          <p>
            Sem TLDR a aplicação apenas lista comandos.
          </p>

          <p>
            Com TLDR você recebe:
          </p>

          <ul>
            <li>descrições</li>
            <li>exemplos</li>
            <li>ajuda rápida</li>
            <li>documentação simplificada</li>
          </ul>

          <hr />

          <h3>
            Como conectar um terminal?
          </h3>

          <p>
            Clique em “Capturar terminal”.
          </p>

          <p>
            Depois clique na janela do terminal que deseja controlar.
          </p>

          <p>
            A aplicação enviará comandos para esse terminal.
          </p>

          <hr />

          <h3>
            Por que conectar um terminal?
          </h3>

          <p>
            A conexão permite executar comandos diretamente a partir da interface.
          </p>

          <p>
            Sem um terminal conectado os comandos apenas exibem documentação.
          </p>

          <hr />

          <h3>
            Clique simples e duplo clique
          </h3>

          <ul>
            <li>
              Clique simples → mostra ajuda e exemplos do comando
            </li>

            <li>
              Duplo clique → executa o comando no terminal conectado
            </li>
          </ul>

          <hr />

          <h3>
            Histórico
          </h3>

          <p>
            A lista principal é carregada do histórico do shell Linux.
          </p>

          <p>
            Comandos repetidos podem ser filtrados automaticamente.
          </p>

          <hr />

          <h3>
            Biblioteca local
          </h3>

          <p>
            Você pode salvar comandos e documentações em SQLite local.
          </p>

          <p>
            Isso transforma o histórico temporário em uma biblioteca pessoal persistente.
          </p>

          <hr />

          <h3>
            Segurança
          </h3>

          <p>
            Revise comandos antes de executar.
          </p>

          <p>
            Alguns comandos Linux podem modificar arquivos, apagar dados ou alterar o sistema.
          </p>

          <hr />

          <h3>
            Objetivo do projeto
          </h3>

          <p>
            O objetivo é criar uma memória operacional pesquisável para terminal Linux.
          </p>

        </div>

      </div>

    </div>
  `

  const closeButton = document.querySelector('#close-main-help') as HTMLButtonElement | null

  if (closeButton) {

    closeButton.onclick = () => {

      helpContainer.innerHTML = ''
    }
  }
}

type SavedCommand = [number, string, string, string, boolean]

async function loadSavedCommands() {

  const commands =
    await invoke<SavedCommand[]>(
      "get_saved_commands"
    );

  if (commands.length == 0) {
    openSavedModal('Comandos salvos', 'Nenhum comando salvo ainda.')

    return;
  }

  openSavedModal('Comandos salvos', commands.map(([id, command, base_command, help, favorite]) => {

    let html =  `
        <div class="history-item">
          <span class="history-command">
              ${command.replace(/[\d]/g, '')}
            </span>`

    let help_ = ''

    let favorite_ = ''

    if (favorite) {
        favorite_ = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 9.24l-7.39-1.68L12 2l-2.61 5.56L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24z"/>
          </svg>`
      }
    if (help && help.length > 0) {
      help_ =`
            <span class="base-command">
              ${base_command} ${favorite_}
            </span>
            <span class="help-text">
              ${help}
            </span>
            `
     html += help_          
    }

    html +=
    `<button
            title="Executar"
            class="run-saved-command"
            data-command="${command}"
          >
            ⏻
          </button>

          <button
            title="Apagar"
            class="delete-saved-command"
            data-id="${id}"
          >
            🗑️
          </button>

        </div>
      `;

    }).join(''))


  const deleteButtons =
    document.querySelectorAll(
      '.delete-saved-command'
    );

  deleteButtons.forEach(button => {

    button.addEventListener(
      'click',
      async () => {
        console.log('deletar');
        try {

          const id = Number(
            (button as HTMLButtonElement)
              .dataset.id
          )

          await invoke(
            'delete_saved_command',
            { id }
          )

          loadSavedCommands()

        } catch (error) {

          console.error(
            'Erro ao deletar comando:',
            error
          );
        }
      }
    );
  });

  const runButtons =
    document.querySelectorAll(
      '.run-saved-command'
    );

  runButtons.forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        try {

          const command =
            (button as HTMLButtonElement)
              .dataset.command

          await invoke(
            'run_command',
            { command }
          )

        } catch (error) {

          console.error(
            'Erro ao executar comando:',
            error
          );
        }
      }
    );
  });
}

viewSavedCommandsButton.onclick = async () => {
  loadSavedCommands()
}

viewSavedHelpsButton.onclick = async () => {
  loadSavedCommands()
}

viewSavedHistoryButton.onclick = async () => {

  const commands =
    await invoke<string[]>(
      'get_saved_history'
    )

  if (commands.length === 0) {

    openSavedModal('Histórico salvo', 'Nenhum histórico salvo ainda.')

    return
  }

  openSavedModal('Histórico salvo', commands.map(command => {

    return `

      <div class="history-item">

        <span class="history-command">${command}</span>

        <button class="run-saved-command" data-command="${command}">
          ⏻
        </button>

        <button class="delete-saved-command" data-command="${command}">
          🗑️
        </button>

      </div>
    `

  }).join(''))
}

function openSavedModal(
  title: string,
  content: string
) {

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

console.log('App iniciado')
checkTldr()
loadHistory()