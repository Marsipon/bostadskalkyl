import { calculateScenario } from './calculations.js';
import { saveStore, loadStore } from './storage.js';
import {
  addCalculation,
  addLoan,
  deleteCalculation,
  duplicateCalculation,
  ensureStore,
  getActiveCalculation,
  importCalculation,
  removeLoan,
  renameCalculation,
  setActiveCalculation,
  updateField,
  updateLoan
} from './state.js';
import { renderApp } from './ui.js';
import {
  copyText,
  decodeShareState,
  downloadJson,
  encodeShareState,
  parseIntegerInput,
  parsePercentInput,
  readTextFile
} from './utils.js';

const root = document.querySelector('#app');
const PERSIST_DELAY_MS = 250;
const bootstrapState = bootstrapStore();
let store = bootstrapState.store;
let sharedPrompt = bootstrapState.sharedPrompt;
let persistTimeoutId = null;

function getActiveScenario() {
  return getActiveCalculation(store);
}

function getSharePayload() {
  const activeCalculation = getActiveScenario();
  return {
    version: store.version,
    calculation: {
      name: activeCalculation.name,
      state: activeCalculation.state
    }
  };
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.hash = encodeShareState(getSharePayload());
  return url.toString();
}

function syncHash() {
  const url = new URL(window.location.href);
  url.hash = encodeShareState(getSharePayload());
  history.replaceState(null, '', url);
}

function clearPendingPersist() {
  if (persistTimeoutId !== null) {
    window.clearTimeout(persistTimeoutId);
    persistTimeoutId = null;
  }
}

function persistStore() {
  clearPendingPersist();
  store = ensureStore(store);
  if (!sharedPrompt) {
    saveStore(store);
  }
  syncHash();
}

function schedulePersist() {
  clearPendingPersist();
  persistTimeoutId = window.setTimeout(() => {
    persistTimeoutId = null;
    persistStore();
  }, PERSIST_DELAY_MS);
}

function flushPendingPersist() {
  if (persistTimeoutId !== null) {
    persistStore();
  }
}

function announce(message) {
  const liveRegion = root.querySelector('[data-role="live-region"]');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

function render() {
  const activeCalculation = getActiveScenario();
  const results = calculateScenario(activeCalculation.state);
  root.innerHTML = renderApp({
    calculations: Object.values(store.calculations).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    activeCalculation,
    results,
    shareUrl: getShareUrl(),
    sharedPrompt
  });
  document.title = `${activeCalculation.name} • Bostadskalkyl`;
}

function bootstrapStore() {
  const initialStore = loadStore();

  try {
    const payload = decodeShareState(window.location.hash.replace(/^#/, ''));
    if (payload) {
      const importedStore = importCalculation(initialStore, payload);
      const importedCalculation = getActiveCalculation(importedStore);
      return {
        store: importedStore,
        sharedPrompt: {
          importedCalculationId: importedCalculation.id,
          name: importedCalculation.name,
          previousStore: ensureStore(initialStore)
        }
      };
    }
  } catch {
    // Ignore invalid shared links and continue with local state.
  }

  return {
    store: ensureStore(initialStore),
    sharedPrompt: null
  };
}

async function importFromFile(file) {
  const text = await readTextFile(file);
  const parsed = JSON.parse(text);
  store = importCalculation(store, parsed);
  persistStore();
  if (sharedPrompt) {
    syncHash();
  }
  render();
  announce('Kalkylen importerades.');
}

async function shareCalculation() {
  const shareUrl = getShareUrl();
  await copyText(shareUrl);
  announce('Delningslänken kopierades.');
}

function exportCalculation() {
  const payload = {
    ...getSharePayload(),
    exportedAt: new Date().toISOString()
  };
  downloadJson('bostadskalkyl.json', payload);
  announce('Kalkylen exporterades som JSON.');
}

function updateValueField(fieldPath, value) {
  const activeCalculation = getActiveScenario();
  const [section, field] = fieldPath.split('.');
  store = updateField(store, activeCalculation.id, section, field, value);
  schedulePersist();
  render();
}

function updateNumberField(target) {
  const value = parseIntegerInput(target.value);
  target.value = value > 0 ? new Intl.NumberFormat('sv-SE').format(value) : '';
  updateValueField(target.dataset.field, value);
}

function updatePercentField(target) {
  const value = parsePercentInput(target.value);
  updateValueField(target.dataset.field, value);
}

function updateLoanField(target) {
  const activeCalculation = getActiveScenario();
  const value = parseIntegerInput(target.value);
  target.value = value > 0 ? new Intl.NumberFormat('sv-SE').format(value) : '';
  store = updateLoan(store, activeCalculation.id, target.dataset.loanId, value);
  schedulePersist();
  render();
}

root.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  const activeCalculation = getActiveScenario();

  try {
    switch (target.dataset.action) {
      case 'new-calculation':
        store = addCalculation(store);
        persistStore();
        render();
        announce('En ny kalkyl skapades.');
        break;
      case 'rename-calculation': {
        const name = prompt('Nytt namn på kalkylen', activeCalculation.name);
        if (name !== null) {
          store = renameCalculation(store, activeCalculation.id, name);
          persistStore();
          render();
          announce('Kalkylen bytte namn.');
        }
        break;
      }
      case 'duplicate-calculation':
        store = duplicateCalculation(store, activeCalculation.id);
        persistStore();
        render();
        announce('Kalkylen duplicerades.');
        break;
      case 'delete-calculation':
        if (confirm('Ta bort den aktiva kalkylen?')) {
          store = deleteCalculation(store, activeCalculation.id);
          persistStore();
          render();
          announce('Kalkylen togs bort.');
        }
        break;
      case 'add-loan':
        store = addLoan(store, activeCalculation.id);
        persistStore();
        render();
        announce('En ny lånedel lades till.');
        break;
      case 'remove-loan':
        store = removeLoan(store, activeCalculation.id, target.dataset.loanId);
        persistStore();
        render();
        announce('Lånedelen togs bort.');
        break;
      case 'share-calculation':
        await shareCalculation();
        break;
      case 'save-shared-calculation':
        sharedPrompt = null;
        persistStore();
        render();
        announce('Den delade kalkylen sparades bland dina kalkyler.');
        break;
      case 'discard-shared-calculation':
        if (sharedPrompt) {
          store = ensureStore(sharedPrompt.previousStore);
          sharedPrompt = null;
          persistStore();
          render();
          announce('Du fortsätter utan att spara den delade kalkylen.');
        }
        break;
      case 'export-calculation':
        exportCalculation();
        break;
      case 'trigger-import':
        root.querySelector('#import-file')?.click();
        break;
      default:
        break;
    }
  } catch (error) {
    announce(error instanceof Error ? error.message : 'Något gick fel.');
  }
});

root.addEventListener('change', async (event) => {
  const target = event.target;

  if (target instanceof HTMLSelectElement && target.dataset.action === 'change-calculation') {
    store = setActiveCalculation(store, target.value);
    persistStore();
    render();
    return;
  }

  if (target instanceof HTMLSelectElement && target.dataset.field && target.dataset.kind === 'string') {
    updateValueField(target.dataset.field, target.value);
    return;
  }

  if (target instanceof HTMLInputElement && target.dataset.field && target.dataset.kind === 'string') {
    updateValueField(target.dataset.field, target.value);
    return;
  }

  if (target instanceof HTMLInputElement && target.type === 'file' && target.files?.[0]) {
    try {
      await importFromFile(target.files[0]);
      target.value = '';
    } catch {
      announce('Filen kunde inte importeras.');
    }
  }
});

root.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.classList.contains('js-number-input')) {
    updateNumberField(target);
  }

  if (target.classList.contains('js-percent-input')) {
    updatePercentField(target);
  }

  if (target.classList.contains('js-loan-input')) {
    updateLoanField(target);
  }

  if (target.classList.contains('js-range-input')) {
    updateValueField(target.dataset.field, parseIntegerInput(target.value));
  }

  if (target.classList.contains('js-percent-range')) {
    updateValueField(target.dataset.field, parsePercentInput(target.value));
  }
});

window.addEventListener('pagehide', () => {
  flushPendingPersist();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      announce('Offline-stöd kunde inte aktiveras.');
    });
  });
}

persistStore();
render();
