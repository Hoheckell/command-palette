import { test, expect } from '@playwright/test'

function createTauriMockScript() {
  return () => {
    const store = {
      history: ['ls', 'git status', 'ls', 'npm test'],
      savedCommands: [] as Array<[number, string]>,
      nextId: 1
    }

    // @ts-expect-error browser test mock
    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: Record<string, unknown>) => {
        if (cmd === 'has_tldr') return true
        if (cmd === 'get_history') return store.history

        if (cmd === 'get_saved_commands') {
          return [...store.savedCommands].reverse()
        }

        if (cmd === 'save_command') {
          const command = String(args?.command ?? '')
          const exists = store.savedCommands.some((item) => item[1] === command)

          if (!exists && command.length > 0) {
            store.savedCommands.push([store.nextId++, command])
          }

          return null
        }

        if (cmd === 'delete_saved_command') {
          const id = Number(args?.id)
          store.savedCommands = store.savedCommands.filter((item) => item[0] !== id)
          return null
        }

        if (cmd === 'save_history') {
          // @ts-expect-error browser test mock
          window.__SAVE_HISTORY_CALLED__ = true
          return null
        }

        if (cmd === 'run_command') {
          // @ts-expect-error browser test mock
          window.__LAST_RUN_COMMAND__ = String(args?.command ?? '')
          return null
        }

        if (cmd === 'save_terminal_window') {
          return 'mock-terminal'
        }

        if (cmd === 'disconnect_terminal') {
          return null
        }

        if (cmd === 'get_saved_history') {
          return store.savedCommands.map(([id, command]) => [id, command])
        }

        if (cmd === 'get_tldr') {
          return 'mock tldr content'
        }

        return null
      },
      transformCallback: () => 1,
      unregisterCallback: () => {},
      convertFileSrc: (path: string) => path
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(createTauriMockScript())
  await page.goto('/')
})

test('carrega historico deduplicado em ordem reversa', async ({ page }) => {
  const rows = page.locator('#history li')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText('npm test')
  await expect(rows.nth(1)).toContainText('ls')
  await expect(rows.nth(2)).toContainText('git status')
})

test('favorito sobe para o topo e muda icone de salvar', async ({ page }) => {
  const firstBefore = page.locator('#history li').first()
  await expect(firstBefore).toContainText('npm test')

  const gitRow = page.locator('#history li', { hasText: 'git status' }).first()
  const favoriteButton = gitRow.locator('button').first()
  const saveButton = gitRow.locator('button').nth(1)

  await expect(saveButton).toHaveText('💾')
  await favoriteButton.click()

  const firstAfter = page.locator('#history li').first()
  await expect(firstAfter).toContainText('git status')
  await expect(firstAfter).toHaveClass(/is-favorite/)

  const gitRowAfter = page.locator('#history li', { hasText: 'git status' }).first()
  await expect(gitRowAfter.locator('button').first()).toHaveText('★')
  await expect(gitRowAfter.locator('button').nth(1)).toHaveText('🗑️')
})

test('desfavoritar mantem comando salvo e volta para ordenacao natural', async ({ page }) => {
  const gitRow = page.locator('#history li', { hasText: 'git status' }).first()
  await gitRow.locator('button').first().click()

  const firstAfterFavorite = page.locator('#history li').first()
  await expect(firstAfterFavorite).toContainText('git status')

  await firstAfterFavorite.locator('button').first().click()

  const firstAfterUnfavorite = page.locator('#history li').first()
  await expect(firstAfterUnfavorite).toContainText('npm test')

  const gitRowAfter = page.locator('#history li', { hasText: 'git status' }).first()
  await expect(gitRowAfter.locator('button').first()).toHaveText('☆')
  await expect(gitRowAfter.locator('button').nth(1)).toHaveText('🗑️')
})

test('botao salvar alterna para lixeira e permite remover', async ({ page }) => {
  const lsRow = page.locator('#history li', { hasText: 'ls' }).first()
  const saveButton = lsRow.locator('button').nth(1)

  await expect(saveButton).toHaveText('💾')
  await saveButton.click()

  const lsRowSaved = page.locator('#history li', { hasText: 'ls' }).first()
  const trashButton = lsRowSaved.locator('button').nth(1)
  await expect(trashButton).toHaveText('🗑️')

  await trashButton.click()

  const lsRowAfterDelete = page.locator('#history li', { hasText: 'ls' }).first()
  await expect(lsRowAfterDelete.locator('button').nth(1)).toHaveText('💾')
})

test('busca filtra comandos e preserva favoritos no resultado', async ({ page }) => {
  await page.locator('#history li', { hasText: 'git status' }).first().locator('button').first().click()
  await page.locator('#search').fill('s')

  const rows = page.locator('#history li')
  await expect(rows.nth(0)).toContainText('git status')
  await expect(rows).toHaveCount(3)
})

test('salvar historico completo atualiza feedback do botao', async ({ page }) => {
  const saveHistoryButton = page.locator('#save-history')
  await saveHistoryButton.click()
  await expect(saveHistoryButton).toHaveText('Histórico salvo')

  const saveCalled = await page.evaluate(() => {
    // @ts-expect-error browser test mock
    return window.__SAVE_HISTORY_CALLED__ === true
  })
  expect(saveCalled).toBeTruthy()
})

test('toggle de tema aplica classe light-theme', async ({ page }) => {
  const toggle = page.locator('#theme-toggle')

  await expect(page.locator('body')).not.toHaveClass(/light-theme/)
  await toggle.check()
  await expect(page.locator('body')).toHaveClass(/light-theme/)
  await toggle.uncheck()
  await expect(page.locator('body')).not.toHaveClass(/light-theme/)
})

test('ajuda principal abre e fecha corretamente', async ({ page }) => {
  await page.locator('#open-help').click()
  await expect(page.locator('.help-overlay')).toBeVisible()
  await page.locator('#close-main-help').click()
  await expect(page.locator('.help-overlay')).toHaveCount(0)
})

test('ajuda de comando abre ao clicar item e permite salvar', async ({ page }) => {
  const npmRow = page.locator('#history li', { hasText: 'npm test' }).first()
  await npmRow.locator('span').first().click()

  await expect(page.locator('#command-help .help-box')).toBeVisible()
  await expect(page.locator('#command-help pre')).toContainText('mock tldr content')

  const saveButton = page.locator('#save-command')
  await saveButton.click()
  await expect(saveButton).toHaveText('Salvo')
})

test('executar comando salvo pelo modal dispara run_command', async ({ page }) => {
  await page.locator('#history li', { hasText: 'npm test' }).first().locator('button').nth(1).click()
  await page.locator('#view-saved-commands').click()

  const modalItem = page.locator('.history-item', { hasText: 'npm test' }).first()
  await modalItem.locator('.run-saved-command').click()

  const lastRun = await page.evaluate(() => {
    // @ts-expect-error browser test mock
    return window.__LAST_RUN_COMMAND__
  })

  expect(lastRun).toBe('npm test')
})

test('lixeira remove item no historico salvo', async ({ page }) => {
  const npmRow = page.locator('#history li', { hasText: 'npm test' }).first()
  await npmRow.locator('button').first().click()

  await page.locator('#view-saved-history').click()

  const modalItem = page.locator('.history-item', { hasText: 'npm test' }).first()
  await expect(modalItem).toBeVisible()

  await modalItem.locator('.delete-saved-command').click()

  await expect(page.locator('.history-item', { hasText: 'npm test' })).toHaveCount(0)
})
