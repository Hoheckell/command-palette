export interface AppDomRefs {
  viewSavedHistoryButton: HTMLButtonElement
  viewSavedCommandsButton: HTMLButtonElement
  viewSavedHelpsButton: HTMLButtonElement
  openCommandBuilderButton: HTMLButtonElement
  helpContainer: HTMLDivElement
  openHelpButton: HTMLButtonElement
  commandHelp: HTMLDivElement
  builderModal: HTMLDivElement
  tldrStatus: HTMLDivElement
  disconnectButton: HTMLButtonElement
  captureButton: HTMLButtonElement
  historyList: HTMLUListElement
  searchInput: HTMLInputElement
  saveHistoryButton: HTMLButtonElement
  themeToggle: HTMLInputElement
  aiStatus: HTMLDivElement
}

export function getAppDomRefs(): AppDomRefs {
  return {
    viewSavedHistoryButton: document.querySelector('#view-saved-history') as HTMLButtonElement,
    viewSavedCommandsButton: document.querySelector('#view-saved-commands') as HTMLButtonElement,
    viewSavedHelpsButton: document.querySelector('#view-saved-helps') as HTMLButtonElement,
    openCommandBuilderButton: document.querySelector('#open-command-builder') as HTMLButtonElement,
    helpContainer: document.querySelector('#app-help') as HTMLDivElement,
    openHelpButton: document.querySelector('#open-help') as HTMLButtonElement,
    commandHelp: document.querySelector('#command-help') as HTMLDivElement,
    builderModal: document.querySelector('#builder-modal') as HTMLDivElement,
    tldrStatus: document.querySelector('#tldr-status') as HTMLDivElement,
    disconnectButton: document.querySelector('#disconnect-terminal') as HTMLButtonElement,
    captureButton: document.querySelector('#capture-terminal') as HTMLButtonElement,
    historyList: document.querySelector('#history') as HTMLUListElement,
    searchInput: document.querySelector('#search') as HTMLInputElement,
    saveHistoryButton: document.querySelector('#save-history') as HTMLButtonElement,
    themeToggle: document.querySelector('#theme-toggle') as HTMLInputElement,
    aiStatus: document.querySelector('#ai-status') as HTMLDivElement
  }
}
