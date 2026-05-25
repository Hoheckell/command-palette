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
            Ela permite pesquisar, estudar, montar comandos visualmente, salvar e executar comandos rapidamente.
          </p>

          <hr />

          <h3>
            Busca Fuzzy
          </h3>

          <p>
            A barra de pesquisa usa busca fuzzy (Fuse.js) para encontrar comandos mesmo com digitação parcial ou aproximada.
          </p>

          <p>
            Quanto mais relevante o comando, mais acima ele aparece nos resultados.
          </p>

          <hr />

          <h3>
            Favoritos
          </h3>

          <p>
            Clique no ícone de estrela (★) ao lado de um comando para favoritá-lo.
          </p>

          <p>
            Comandos favoritados aparecem sempre no topo da lista e ficam salvos entre sessões.
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
            Você pode verificar o status do TLDR no canto inferior direito e instalar diretamente pela interface se necessário.
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
            Explicação com IA
          </h3>

          <p>
            Ao visualizar a documentação de um comando, clique em "Explicação aprofundada" para obter uma análise detalhada gerada por IA.
          </p>

          <p>
            A aplicação usa OpenRouter com diversos modelos gratuitos em cadeia de fallback. Para usar, configure sua chave de API no botão "Configurar" na barra inferior.
          </p>

          <hr />

          <h3>
            Construtor de Comandos
          </h3>

          <p>
            O "Construtor de Comandos" (ícone de engrenagem) permite montar comandos visualmente.
          </p>

          <p>
            Digite o comando base (ex: ssh, docker, ffmpeg), clique em "Carregar flags" e selecione as opções desejadas com checkboxes.
          </p>

          <p>
            Você pode copiar, executar ou salvar o comando montado.
          </p>

          <hr />

          <h3>
            Como conectar um terminal?
          </h3>

          <p>
            Clique em "Capturar terminal" na barra inferior.
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
            A lista principal é carregada do histórico do shell Linux (~/.bash_history).
          </p>

          <p>
            Comandos repetidos são filtrados automaticamente.
          </p>

          <p>
            Você também pode acessar "Histórico salvo" para ver comandos que foram persistidos no banco de dados.
          </p>

          <hr />

          <h3>
            Biblioteca local (SQLite)
          </h3>

          <p>
            Você pode salvar comandos e documentações no SQLite local clicando no ícone de disquete.
          </p>

          <p>
            Isso transforma o histórico temporário em uma biblioteca pessoal persistente.
          </p>

          <p>
            Acesse "Comandos salvos" para visualizar, executar ou deletar itens da sua biblioteca.
          </p>

          <hr />

          <h3>
            Tema claro/escuro
          </h3>

          <p>
            Alterne entre tema claro e escuro usando o checkbox na barra superior. Sua preferência é lembrada entre sessões.
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
            O objetivo é criar uma memória operacional pesquisável para terminal Linux, combinando histórico, documentação TLDR, explicações por IA e um construtor visual de comandos.
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
