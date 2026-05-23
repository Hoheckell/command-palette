export function openAppHelp(helpContainer: HTMLDivElement) {
  const closeModal = () => {
    helpContainer.innerHTML = ''
    document.removeEventListener('keydown', handleEscape)
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  document.addEventListener('keydown', handleEscape)

  helpContainer.innerHTML = `

    <div class="help-overlay">

      <div class="help-modal">

        <div class="help-modal-top">

          <h2>
            Sobre o Hoheckell's Command Palette
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
            Clique em "Capturar terminal".
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
              Clique simples -> mostra ajuda e exemplos do comando
            </li>

            <li>
              Duplo clique -> executa o comando no terminal conectado
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
  const overlay = helpContainer.querySelector('.help-overlay') as HTMLDivElement | null

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
